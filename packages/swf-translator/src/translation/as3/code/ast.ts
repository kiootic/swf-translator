import { TypeRef } from "./type-ref";

export type ASTWalker = (node: ASTNode) => void | ASTNode;

function walk<T extends ASTNode | null>(fn: ASTWalker, value: T): T;
function walk<T extends ASTNode>(fn: ASTWalker, value: T): T;
function walk(fn: ASTWalker, value: ASTNode | null): ASTNode | null {
  if (!value) {
    return value;
  }
  let result = fn(value);
  if (!result) {
    result = value;
  }
  result.walk(fn);
  return result;
}

function walkArray<T extends ASTNode>(fn: ASTWalker, items: T[]) {
  for (let i = 0; i < items.length; i++) {
    items[i] = walk(fn, items[i]);
  }
}

export abstract class ASTNode {
  readonly isAST = true;

  abstract walk(fn: ASTWalker): void;
}

export abstract class NodeStatement extends ASTNode {
  readonly isStatement = true;
}
export abstract class NodeExpression extends ASTNode {
  readonly isExpression = true;
}

export class NodeError extends NodeStatement {
  constructor(public error: unknown) {
    super();
  }

  walk() {}
}

export class NodeBlock extends NodeStatement {
  constructor(readonly statements: NodeStatement[]) {
    super();
  }

  walk(fn: ASTWalker) {
    walkArray(fn, this.statements);
  }
}

export class NodeStmtExpr extends NodeStatement {
  constructor(public expression: NodeExpression) {
    super();
  }

  walk(fn: ASTWalker) {
    this.expression = walk(fn, this.expression);
  }
}

export class NodeStmtLabel extends NodeStatement {
  constructor(public label: string, public statement: NodeStatement) {
    super();
  }

  walk(fn: ASTWalker) {
    this.statement = walk(fn, this.statement);
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

  walk(fn: ASTWalker) {
    for (const binding of this.bindings) {
      binding.initialValue = walk(fn, binding.initialValue);
    }
  }
}

export class NodeStmtDebugger extends NodeStatement {
  constructor() {
    super();
  }

  walk() {}
}

export class NodeStmtContinue extends NodeStatement {
  constructor(public label: string | null) {
    super();
  }

  walk() {}
}

export class NodeStmtBreak extends NodeStatement {
  constructor(public label: string | null) {
    super();
  }

  walk() {}
}

export class NodeStmtThrow extends NodeStatement {
  constructor(public expression: NodeExpression) {
    super();
  }

  walk(fn: ASTWalker) {
    this.expression = walk(fn, this.expression);
  }
}

export class NodeStmtReturn extends NodeStatement {
  constructor(public expression: NodeExpression | null) {
    super();
  }

  walk(fn: ASTWalker) {
    this.expression = walk(fn, this.expression);
  }
}

export class NodeStmtTry extends NodeStatement {
  constructor(
    public tryBlock: NodeBlock,
    public catchBlock: NodeBlock,
    public exceptionVar: string
  ) {
    super();
  }

  walk(fn: ASTWalker) {
    this.tryBlock = walk(fn, this.tryBlock);
    this.catchBlock = walk(fn, this.catchBlock);
  }
}

export interface SwitchItem {
  value: NodeExpression | null;
  statements: NodeStatement[];
}

export class NodeStmtSwitch extends NodeStatement {
  constructor(public condition: NodeExpression, public items: SwitchItem[]) {
    super();
  }

  walk(fn: ASTWalker) {
    this.condition = walk(fn, this.condition);
    for (const item of this.items) {
      item.value = walk(fn, item.value);
      walkArray(fn, item.statements);
    }
  }
}

export class NodeStmtIf extends NodeStatement {
  constructor(
    public condition: NodeExpression,
    public trueBody: NodeStatement,
    public falseBody: NodeStatement | null
  ) {
    super();
  }

  walk(fn: ASTWalker) {
    this.condition = walk(fn, this.condition);
    this.trueBody = walk(fn, this.trueBody);
    this.falseBody = walk(fn, this.falseBody);
  }
}

export class NodeStmtDo extends NodeStatement {
  constructor(public condition: NodeExpression, public body: NodeStatement) {
    super();
  }

  walk(fn: ASTWalker) {
    this.condition = walk(fn, this.condition);
    this.body = walk(fn, this.body);
  }
}

export class NodeStmtWhile extends NodeStatement {
  constructor(public condition: NodeExpression, public body: NodeStatement) {
    super();
  }

  walk(fn: ASTWalker) {
    this.condition = walk(fn, this.condition);
    this.body = walk(fn, this.body);
  }
}

export class NodeStmtFor extends NodeStatement {
  constructor(
    public initializer: ASTNode | null,
    public condition: NodeExpression | null,
    public next: NodeExpression | null,
    public body: NodeStatement
  ) {
    super();
  }

  walk(fn: ASTWalker) {
    this.initializer = walk(fn, this.initializer);
    this.condition = walk(fn, this.condition);
    this.next = walk(fn, this.next);
    this.body = walk(fn, this.body);
  }
}

export class NodeStmtForIn extends NodeStatement {
  constructor(
    public variable: ASTNode,
    public value: NodeExpression,
    public type: "in" | "of",
    public body: NodeStatement
  ) {
    super();
  }

  walk(fn: ASTWalker) {
    this.variable = walk(fn, this.variable);
    this.value = walk(fn, this.value);
    this.body = walk(fn, this.body);
  }
}

export class NodeExprConst extends NodeExpression {
  constructor(public value: unknown) {
    super();
  }

  walk() {}
}

export class NodeExprThis extends NodeExpression {
  constructor() {
    super();
  }

  walk() {}
}

export class NodeExprSuper extends NodeExpression {
  constructor() {
    super();
  }

  walk() {}
}

export class NodeExprType extends NodeExpression {
  constructor(public type: TypeRef, public isValue: boolean) {
    super();
  }

  walk() {}
}

export class NodeExprProperty extends NodeExpression {
  constructor(public object: NodeExpression, public name: string) {
    super();
  }

  walk(fn: ASTWalker) {
    this.object = walk(fn, this.object);
  }
}

export class NodeExprIndexer extends NodeExpression {
  constructor(public object: NodeExpression, public index: NodeExpression) {
    super();
  }

  walk(fn: ASTWalker) {
    this.object = walk(fn, this.object);
    this.index = walk(fn, this.index);
  }
}

export class NodeExprVariable extends NodeExpression {
  constructor(public name: string) {
    super();
  }

  walk() {}
}

export interface ObjectLiteralEntry {
  key: NodeExpression;
  value: NodeExpression;
}

export class NodeExprLiteralObject extends NodeExpression {
  constructor(readonly entries: ObjectLiteralEntry[]) {
    super();
  }

  walk(fn: ASTWalker) {
    for (const entry of this.entries) {
      entry.key = walk(fn, entry.key);
      entry.value = walk(fn, entry.value);
    }
  }
}

export class NodeExprLiteralArray extends NodeExpression {
  constructor(readonly items: NodeExpression[]) {
    super();
  }

  walk(fn: ASTWalker) {
    walkArray(fn, this.items);
  }
}

export class NodeExprNew extends NodeExpression {
  constructor(public type: NodeExpression, readonly args: NodeExpression[]) {
    super();
  }

  walk(fn: ASTWalker) {
    this.type = walk(fn, this.type);
    walkArray(fn, this.args);
  }
}

export class NodeExprCall extends NodeExpression {
  constructor(public fn: NodeExpression, readonly args: NodeExpression[]) {
    super();
  }

  walk(fn: ASTWalker) {
    this.fn = walk(fn, this.fn);
    walkArray(fn, this.args);
  }
}

export class NodeExprUnary extends NodeExpression {
  constructor(public op: string, public operand: NodeExpression) {
    super();
  }

  walk(fn: ASTWalker) {
    this.operand = walk(fn, this.operand);
  }
}

export class NodeExprPostfix extends NodeExpression {
  constructor(public op: string, public operand: NodeExpression) {
    super();
  }

  walk(fn: ASTWalker) {
    this.operand = walk(fn, this.operand);
  }
}

export class NodeExprBinary extends NodeExpression {
  constructor(
    public op: string,
    public operandA: NodeExpression,
    public operandB: NodeExpression
  ) {
    super();
  }

  walk(fn: ASTWalker) {
    this.operandA = walk(fn, this.operandA);
    this.operandB = walk(fn, this.operandB);
  }
}

export class NodeExprTernary extends NodeExpression {
  constructor(
    public condition: NodeExpression,
    public trueValue: NodeExpression,
    public falseValue: NodeExpression
  ) {
    super();
  }

  walk(fn: ASTWalker) {
    this.condition = walk(fn, this.condition);
    this.trueValue = walk(fn, this.trueValue);
    this.falseValue = walk(fn, this.falseValue);
  }
}

export class NodeExprAssignment extends NodeExpression {
  constructor(
    public op: string,
    public target: NodeExpression,
    public value: NodeExpression
  ) {
    super();
  }

  walk(fn: ASTWalker) {
    this.target = walk(fn, this.target);
    this.value = walk(fn, this.value);
  }
}
