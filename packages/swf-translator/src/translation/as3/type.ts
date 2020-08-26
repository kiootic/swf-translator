import { File, terms } from "../../as3/parse";
import { TypeRef, TypeRefKind } from "./code/type-ref";
import { Node } from "../../as3/node";

export function translateType(file: File, typeNode: Node): TypeRef {
  let typeInstanceNode: Node | null;
  if (typeNode.findNamedChild("*")) {
    return { kind: TypeRefKind.Any };
  } else if (typeNode.findNamedChild("void")) {
    return { kind: TypeRefKind.Void };
  } else if ((typeInstanceNode = typeNode.findChild(terms.VectorType))) {
    const elementTypeNode = typeInstanceNode.findChild(terms.Type);
    if (!elementTypeNode) {
      throw new Error("expect vector element type");
    }
    return {
      kind: TypeRefKind.Array,
      elementType: translateType(file, elementTypeNode),
    };
  } else if ((typeInstanceNode = typeNode.findChild(terms.TypeName))) {
    throw new Error("NYI");
  }
  throw new Error("NYI");
}
