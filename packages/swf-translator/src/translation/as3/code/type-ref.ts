export type TypeRef = TypeRefClass | TypeRefArray | TypeRefPrimitive;

export enum TypeRefKind {
  Class = "class",
  Array = "array",
  Any = "any",
  Void = "void",
}

export interface TypeRefClass {
  kind: TypeRefKind.Class;
  namespace: string;
  name: string;
}

export interface TypeRefArray {
  kind: TypeRefKind.Array;
  elementType: TypeRef;
}

export interface TypeRefPrimitive {
  kind: TypeRefKind.Any | TypeRefKind.Void;
}
