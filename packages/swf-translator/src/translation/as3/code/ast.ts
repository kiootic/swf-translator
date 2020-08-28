import { TypeRef } from "./type-ref";

export abstract class ASTNode {
  readonly isAST = true;
}

export abstract class NodeStatement extends ASTNode {
  readonly isStatement = true;
}
export abstract class NodeExpression extends ASTNode {
  readonly isExpression = true;
}

export class NodeError extends NodeStatement {
  constructor(readonly error: unknown) {
    super();
  }
}

export class NodeBlock extends NodeStatement {
  constructor(readonly statements: NodeStatement[]) {
    super();
  }
}

export class NodeStmtExpr extends NodeStatement {
  constructor(readonly expression: NodeExpression) {
    super();
  }
}

export class NodeStmtLabel extends NodeStatement {
  constructor(readonly label: string, readonly statement: NodeStatement) {
    super();
  }
}

export interface VariableBinding {
  name: string;
  type: TypeRef;
  initialValue: NodeExpression | null;
}

export class NodeStmtVarDecl extends NodeStatement {
  constructor(readonly bindings: VariableBinding[]) {
    super();
  }
}

export class NodeStmtDebugger extends NodeStatement {
  constructor() {
    super();
  }
}

export class NodeStmtContinue extends NodeStatement {
  constructor(readonly label: string | null) {
    super();
  }
}

export class NodeStmtBreak extends NodeStatement {
  constructor(readonly label: string | null) {
    super();
  }
}

export class NodeStmtThrow extends NodeStatement {
  constructor(readonly expression: NodeExpression) {
    super();
  }
}

export class NodeStmtReturn extends NodeStatement {
  constructor(readonly expression: NodeExpression | null) {
    super();
  }
}

export class NodeStmtTry extends NodeStatement {
  constructor(
    readonly tryBlock: NodeBlock,
    readonly catchBlock: NodeBlock,
    readonly exceptionVar: string
  ) {
    super();
  }
}

export interface SwitchItem {
  value: NodeExpression | null;
  statements: NodeStatement[];
}

export class NodeStmtSwitch extends NodeStatement {
  constructor(
    readonly condition: NodeExpression,
    readonly items: SwitchItem[]
  ) {
    super();
  }
}

export class NodeStmtIf extends NodeStatement {
  constructor(
    readonly condition: NodeExpression,
    readonly trueBody: NodeStatement,
    readonly falseBody: NodeStatement | null
  ) {
    super();
  }
}

export class NodeStmtDo extends NodeStatement {
  constructor(
    readonly condition: NodeExpression,
    readonly body: NodeStatement
  ) {
    super();
  }
}

export class NodeStmtWhile extends NodeStatement {
  constructor(
    readonly condition: NodeExpression,
    readonly body: NodeStatement
  ) {
    super();
  }
}

export class NodeStmtFor extends NodeStatement {
  constructor(
    readonly initializer: ASTNode | null,
    readonly condition: NodeExpression | null,
    readonly next: NodeExpression | null,
    readonly body: NodeStatement
  ) {
    super();
  }
}

export class NodeStmtForIn extends NodeStatement {
  constructor(
    readonly variable: ASTNode,
    readonly value: NodeExpression,
    readonly type: "in" | "of",
    readonly body: NodeStatement
  ) {
    super();
  }
}

export class NodeExprConst extends NodeExpression {
  constructor(readonly value: unknown) {
    super();
  }
}

export class NodeExprThis extends NodeExpression {
  constructor() {
    super();
  }
}

export class NodeExprSuper extends NodeExpression {
  constructor() {
    super();
  }
}

export class NodeExprType extends NodeExpression {
  constructor(readonly type: TypeRef, readonly isValue: boolean) {
    super();
  }
}

export class NodeExprProperty extends NodeExpression {
  constructor(readonly object: NodeExpression, readonly name: string) {
    super();
  }
}

export class NodeExprIndexer extends NodeExpression {
  constructor(readonly object: NodeExpression, readonly index: NodeExpression) {
    super();
  }
}

export class NodeExprVariable extends NodeExpression {
  constructor(readonly name: string) {
    super();
  }
}

export interface ObjectLiteralEntry {
  key: NodeExpression;
  value: NodeExpression;
}

export class NodeExprLiteralObject extends NodeExpression {
  constructor(readonly entries: ObjectLiteralEntry[]) {
    super();
  }
}

export class NodeExprLiteralArray extends NodeExpression {
  constructor(readonly items: NodeExpression[]) {
    super();
  }
}

export class NodeExprNew extends NodeExpression {
  constructor(readonly type: NodeExpression, readonly args: NodeExpression[]) {
    super();
  }
}

export class NodeExprCall extends NodeExpression {
  constructor(readonly fn: NodeExpression, readonly args: NodeExpression[]) {
    super();
  }
}

export class NodeExprUnary extends NodeExpression {
  constructor(readonly op: string, readonly operand: NodeExpression) {
    super();
  }
}

export class NodeExprPostfix extends NodeExpression {
  constructor(readonly op: string, readonly operand: NodeExpression) {
    super();
  }
}

export class NodeExprBinary extends NodeExpression {
  constructor(
    readonly op: string,
    readonly operandA: NodeExpression,
    readonly operandB: NodeExpression
  ) {
    super();
  }
}

export class NodeExprTernary extends NodeExpression {
  constructor(
    readonly condition: NodeExpression,
    readonly trueValue: NodeExpression,
    readonly falseValue: NodeExpression
  ) {
    super();
  }
}

export class NodeExprAssignment extends NodeExpression {
  constructor(
    readonly op: string,
    readonly target: NodeExpression,
    readonly value: NodeExpression
  ) {
    super();
  }
}
