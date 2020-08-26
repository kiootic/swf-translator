export type TypeRef =
  | TypeRefGlobal
  | TypeRefClass
  | TypeRefArray
  | TypeRefPrimitive;

export enum TypeRefKind {
  Global = "global",
  Class = "class",
  Array = "array",

  Any = "any",
  Void = "void",
  Object = "object",
  String = "string",
  Number = "number",
  Boolean = "boolean",
}

export interface TypeRefGlobal {
  kind: TypeRefKind.Global;
  name: string;
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
  kind:
    | TypeRefKind.Any
    | TypeRefKind.Void
    | TypeRefKind.Object
    | TypeRefKind.String
    | TypeRefKind.Number
    | TypeRefKind.Boolean;
}
