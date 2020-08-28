import { terms } from "../../as3/parse";
import { TypeRef, TypeRefKind } from "./code/type-ref";
import { Node } from "../../as3/node";
import { Scope } from "./code/scope";

export function translateType(scope: Scope, typeNode: Node): TypeRef {
  let typeInstanceNode: Node | null;
  if (typeNode.findChild(terms.Any)) {
    return { kind: TypeRefKind.Any };
  } else if (typeNode.findNamedChild("void")) {
    return { kind: TypeRefKind.Void };
  } else if ((typeInstanceNode = typeNode.findChild(terms.VectorType))) {
    const elementTypeNode = typeInstanceNode.findChild(terms.Type);
    if (!elementTypeNode) {
      throw new Error("Expect vector element type");
    }
    return {
      kind: TypeRefKind.Array,
      elementType: translateType(scope, elementTypeNode),
    };
  } else if ((typeInstanceNode = typeNode.findChild(terms.TypeName))) {
    const name = typeInstanceNode.text;
    return scope.resolveType(name);
  } else {
    throw new Error("Unexpected type instance node");
  }
}
