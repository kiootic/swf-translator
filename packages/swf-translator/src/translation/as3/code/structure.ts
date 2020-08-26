import { TypeRef } from "./type-ref";
import { ASTNode } from "./ast";

export class ClassDef {
  readonly extendTypes: TypeRef[] = [];
  readonly implementTypes: TypeRef[] = [];
  readonly fields: FieldDef[] = [];
  readonly methods: MethodDef[] = [];
  ctor?: MethodDef;
  cctor?: MethodDef;

  constructor(
    readonly namespace: string,
    readonly name: string,
    readonly isInterface: boolean
  ) {}
}

export enum Visibility {
  Private = "private",
  Public = "public",
  Protected = "protected",
}

export class FieldDef {
  constructor(
    readonly name: string,
    readonly type: TypeRef,
    readonly isStatic: boolean,
    readonly isReadonly: boolean,
    readonly visibility: Visibility,
    readonly initialValue: ASTNode | null
  ) {}
}

export enum MethodKind {
  Method = "method",
  Getter = "getter",
  Setter = "setter",
}

export class MethodDef {
  constructor(
    readonly kind: MethodKind,
    readonly name: string,
    readonly isStatic: boolean,
    readonly visibility: Visibility,
    readonly params: ParamDef[],
    readonly returnType: TypeRef
  ) {}

  body?: unknown;
}

export class ParamDef {
  constructor(
    readonly name: string,
    readonly type: TypeRef,
    readonly defaultValue: ASTNode | null,
    readonly isRest: boolean
  ) {}
}
