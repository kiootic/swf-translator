import { File, terms } from "../../as3/parse";
import { Node } from "../../as3/node";
import { AS3Context } from "./context";
import { ClassDef } from "./code/structure";

export function translateStructure(ctx: AS3Context, files: File[]) {
  for (const file of files) {
    translateTopTypes(ctx, file.node);
  }
}

function translateTopTypes(ctx: AS3Context, node: Node) {
  const classes = node.findRecursiveChildren(terms.ClassDeclaration);
  const interfaces = node.findRecursiveChildren(terms.InterfaceDeclaration);
  for (const typeNode of [...classes, ...interfaces]) {
    const nameNode =
      typeNode.findChild(terms.VariableDefinition) ??
      typeNode.findChild(terms.TypeDefinition);
    if (!nameNode) {
      continue;
    }
    const name = nameNode.text;

    let packageName = "";
    let packageNode = typeNode.parent;
    while (packageNode) {
      if (packageNode.term === terms.PackageDeclaration) {
        const nameNode = packageNode.findChild(terms.PackageName);
        if (nameNode) {
          packageName = nameNode.text;
        }
        break;
      }
      packageNode = packageNode.parent;
    }

    const isInterface = !!typeNode.findNamedChild("interface");
    const classDef = new ClassDef(packageName, name, isInterface);
    ctx.addClass(classDef);
  }
}
