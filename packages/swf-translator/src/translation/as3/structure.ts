import { File, terms } from "../../as3/parse";
import { Node } from "../../as3/node";
import { AS3Context } from "./context";
import {
  ClassDef,
  FieldDef,
  Visibility,
  MethodKind,
  ParamDef,
  MethodDef,
} from "./code/structure";
import { Scope } from "./code/scope";
import { TypeRefKind, TypeRef } from "./code/type-ref";
import { translateType } from "./type";
import { ASTNode } from "./code/ast";

export function translateStructure(ctx: AS3Context, files: File[]) {
  const classTranslators: Array<() => void> = [];
  for (const file of files) {
    translateScope(ctx, new Scope(ctx, null), file.node, classTranslators);
  }
  for (const translate of classTranslators) {
    translate();
  }
}

function translateScope(
  ctx: AS3Context,
  scope: Scope,
  node: Node,
  classTranslators: Array<() => void>
) {
  for (const importNode of node.findChildren(terms.ImportDeclaration)) {
    const nameNode = importNode.findChild(terms.ImportName);
    if (!nameNode) {
      continue;
    }
    const match = /^(?:(.+)\.)?(.+)$/.exec(nameNode.text);
    if (!match) {
      continue;
    }
    const [, packageName, name] = match;

    if (name === "*") {
      scope.importedPackages.push(packageName);
    } else {
      scope.importedTypes.push({
        kind: TypeRefKind.Class,
        namespace: packageName,
        name: name,
      });
    }
  }

  for (const packageNode of node.findChildren(terms.PackageDeclaration)) {
    const nameNode = packageNode.findChild(terms.PackageName);
    const blockNode = packageNode.findChild(terms.DeclarationBlock);
    if (!blockNode) {
      continue;
    }

    const packageScope = scope.child();
    packageScope.packageName = nameNode?.text ?? "";
    translateScope(ctx, packageScope, blockNode, classTranslators);
  }

  for (const classNode of node.findChildren(terms.ClassDeclaration)) {
    const nameNode = classNode.findChild(terms.VariableDefinition);
    const bodyNode = classNode.findChild(terms.ClassBody);
    if (!nameNode || !bodyNode) {
      continue;
    }

    const classScope = scope.child();
    const classDef = new ClassDef(
      classScope,
      classScope.packageName ?? "",
      nameNode.text,
      false
    );
    classScope.classDef = classDef;
    ctx.addClass(classDef);

    classTranslators.push(() => translateClass(classDef, classNode, bodyNode));
  }

  for (const interfaceNode of node.findChildren(terms.InterfaceDeclaration)) {
    const nameNode = interfaceNode.findChild(terms.VariableDefinition);
    const bodyNode = interfaceNode.findChild(terms.ClassBody);
    if (!nameNode || !bodyNode) {
      continue;
    }

    const interfaceScope = scope.child();
    const classDef = new ClassDef(
      interfaceScope,
      interfaceScope.packageName ?? "",
      nameNode.text,
      true
    );
    interfaceScope.classDef = classDef;
    ctx.addClass(classDef);

    classTranslators.push(() =>
      translateClass(classDef, interfaceNode, bodyNode)
    );
  }
}

function translateClass(def: ClassDef, defNode: Node, bodyNode: Node) {
  let node: Node | null;
  if ((node = defNode.findChild(terms.ExtendsClause))) {
    if ((node = node.findChild(terms.Type))) {
      def.extendType = translateType(def.scope, node);
    }
  }
  if ((node = defNode.findChild(terms.ImplementsClause))) {
    for (const typeNode of node.findChildren(terms.Type)) {
      def.implementTypes.push(translateType(def.scope, typeNode));
    }
  }

  for (const fieldNode of bodyNode.findChildren(terms.PropertyDeclaration)) {
    translateField(def, fieldNode);
  }

  for (const methodNode of bodyNode.findChildren(terms.MethodDeclaration)) {
    translateMethod(def, methodNode);
  }

  for (const initNode of bodyNode.findChildren(terms.ClassInitializer)) {
    translateClassInitializer(def, initNode);
  }
}

function translateVisibility(node: Node): Visibility {
  let visibility = Visibility.Public;
  if (node.findNamedChild("private")) {
    visibility = Visibility.Private;
  } else if (node.findNamedChild("protected")) {
    visibility = Visibility.Protected;
  }
  return visibility;
}

function translateField(classDef: ClassDef, fieldNode: Node) {
  let node: Node | null;
  const nameNode = fieldNode.findChild(terms.PropertyNameDefinition);
  if (!nameNode) {
    return;
  }

  const visibility = translateVisibility(fieldNode);
  const isStatic = !!fieldNode.findNamedChild("static");
  const isReadonly = !!fieldNode.findNamedChild("const");
  const name = nameNode.text;

  let fieldType: TypeRef = { kind: TypeRefKind.Any };
  if ((node = fieldNode.findChild(terms.TypeAnnotation))) {
    if ((node = node.findChild(terms.Type))) {
      fieldType = translateType(classDef.scope, node);
    }
  }

  let initializer: ASTNode | null = null;
  if ((node = fieldNode.findChild(terms.Expression))) {
    // FIXME: translate initializer
    initializer = new ASTNode();
  }

  const fieldDef = new FieldDef(
    name,
    fieldType,
    isStatic,
    isReadonly,
    visibility,
    initializer
  );
  classDef.fields.push(fieldDef);
}

function translateMethod(classDef: ClassDef, methodNode: Node) {
  let node: Node | null;
  const nameNode = methodNode.findChild(terms.PropertyNameDefinition);
  if (!nameNode) {
    return;
  }

  const visibility = translateVisibility(methodNode);
  const isStatic = !!methodNode.findNamedChild("static");
  const name = nameNode.text;

  let kind = MethodKind.Method;
  if (methodNode.findNamedChild("get")) {
    kind = MethodKind.Getter;
  } else if (methodNode.findNamedChild("set")) {
    kind = MethodKind.Setter;
  }

  let returnType: TypeRef = { kind: TypeRefKind.Any };
  if ((node = methodNode.findChild(terms.TypeAnnotation))) {
    if ((node = node.findChild(terms.Type))) {
      returnType = translateType(classDef.scope, node);
    }
  }

  const paramsNode = methodNode.findChild(terms.ParamList);
  const parameters: ParamDef[] = [];
  if (paramsNode) {
    for (const paramNode of paramsNode.findChildren(
      terms.ParameterDeclaration
    )) {
      const param = translateParam(classDef, paramNode);
      if (param) {
        parameters.push(param);
      }
    }
  }

  const methodScope = classDef.scope.child();
  const methodDef = new MethodDef(
    methodScope,
    kind,
    name,
    isStatic,
    visibility,
    parameters,
    returnType
  );
  methodScope.methodDef = methodDef;
  if (methodDef.name === classDef.name) {
    classDef.ctor = methodDef;
  } else {
    classDef.methods.push(methodDef);
  }

  methodDef.bodyNode = methodNode.findChild(terms.Block);
  if (methodDef.bodyNode) {
    // FIXME: remove this
    methodDef.body = new ASTNode();
  }
}

function translateParam(classDef: ClassDef, paramNode: Node): ParamDef | null {
  let node: Node | null;
  const bindingNode = paramNode.findChild(terms.VariableBinding);
  if (!bindingNode) {
    return null;
  }

  const isRest = !!paramNode.findNamedChild("...");
  const nameNode = bindingNode.findChild(terms.VariableDefinition);
  if (!nameNode) {
    return null;
  }

  let paramType: TypeRef = { kind: TypeRefKind.Any };
  if ((node = bindingNode.findChild(terms.TypeAnnotation))) {
    if ((node = node.findChild(terms.Type))) {
      paramType = translateType(classDef.scope, node);
    }
  }

  let defaultValue: ASTNode | null = null;
  if ((node = bindingNode.findChild(terms.Expression))) {
    // FIXME: translate default value
    defaultValue = new ASTNode();
  }

  return new ParamDef(nameNode.text, paramType, defaultValue, isRest);
}

function translateClassInitializer(classDef: ClassDef, initializerNode: Node) {
  const methodScope = classDef.scope.child();
  const methodDef = new MethodDef(
    methodScope,
    MethodKind.Method,
    "__cctor",
    true,
    Visibility.Public,
    [],
    { kind: TypeRefKind.Void }
  );
  methodScope.methodDef = methodDef;
  classDef.cctor = methodDef;

  methodDef.bodyNode = initializerNode.findChild(terms.Block);
  if (methodDef.bodyNode) {
    // FIXME: remove this
    methodDef.body = new ASTNode();
  }
}
