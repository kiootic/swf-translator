import { File, terms } from "../../as3/parse";
import { Node } from "../../as3/node";
import { AS3Context } from "./context";
import { ClassDef } from "./code/structure";
import { Scope } from "./code/scope";
import { TypeRefKind } from "./code/type-ref";

export function translateStructure(ctx: AS3Context, files: File[]) {
  for (const file of files) {
    translateScope(ctx, new Scope(ctx, null), file.node);
  }
}

function translateScope(ctx: AS3Context, scope: Scope, node: Node) {
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
    translateScope(ctx, packageScope, blockNode);
  }

  for (const packageNode of node.findChildren(terms.PackageDeclaration)) {
    const nameNode = packageNode.findChild(terms.PackageName);
    const blockNode = packageNode.findChild(terms.DeclarationBlock);
    if (!blockNode) {
      continue;
    }

    const packageScope = scope.child();
    packageScope.packageName = nameNode?.text ?? "";
    translateScope(ctx, packageScope, blockNode);
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
  }
}
