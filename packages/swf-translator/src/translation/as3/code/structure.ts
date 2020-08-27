import { TypeRef } from "./type-ref";
import * as ast from "./ast";
import { Scope } from "./scope";
import { Node } from "../../../as3/node";

export class ClassDef {
  extendType?: TypeRef;
  readonly implementTypes: TypeRef[] = [];
  readonly fields: FieldDef[] = [];
  readonly methods: MethodDef[] = [];
  ctor?: MethodDef;
  cctor?: MethodDef;

  constructor(
    readonly scope: Scope,
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
    readonly initializerNode: Node | null
  ) {}

  initialValue: ast.NodeExpression | null = null;
}

export enum MethodKind {
  Method = "method",
  Getter = "getter",
  Setter = "setter",
}

export class MethodDef {
  constructor(
    readonly scope: Scope,
    readonly kind: MethodKind,
    readonly name: string,
    readonly isStatic: boolean,
    readonly visibility: Visibility,
    readonly params: ParamDef[],
    readonly returnType: TypeRef,
    readonly bodyNode: Node | null
  ) {}

  body: ast.NodeBlock | null = null;
}

export class ParamDef {
  constructor(
    readonly name: string,
    readonly type: TypeRef,
    readonly initializerNode: Node | null,
    readonly isRest: boolean
  ) {}

  defaultValue: ast.NodeExpression | null = null;
}
