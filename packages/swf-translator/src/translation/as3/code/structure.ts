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
    public namespace: string,
    public name: string,
    public isInterface: boolean
  ) {}
}

export enum Visibility {
  Private = "private",
  Public = "public",
  Protected = "protected",
}

export class FieldDef {
  constructor(
    public name: string,
    public type: TypeRef,
    public isStatic: boolean,
    public isReadonly: boolean,
    public visibility: Visibility,
    public initializerNode: Node | null
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
    public kind: MethodKind,
    public name: string,
    public isStatic: boolean,
    public visibility: Visibility,
    readonly params: ParamDef[],
    public returnType: TypeRef,
    public bodyNode: Node | null
  ) {}

  body: ast.NodeBlock | null = null;
}

export class ParamDef {
  constructor(
    public name: string,
    public type: TypeRef,
    public initializerNode: Node | null,
    public isRest: boolean
  ) {}

  defaultValue: ast.NodeExpression | null = null;
}
