import JSON5 from "json5";
import { Node } from "../../as3/node";
import { Scope, VariableKind } from "./code/scope";
import * as ast from "./code/ast";
import { terms } from "../../as3/parse";
import { TypeRef, TypeRefKind } from "./code/type-ref";
import { translateType } from "./type";
import { AS3Context } from "./context";
import { fixupField, fixupMethod } from "./fixups";

export function translateAST(ctx: AS3Context) {
  for (const classDef of ctx.classes.values()) {
    for (const field of classDef.fields) {
      if (field.initializerNode) {
        field.initialValue = translateExpression(
          classDef.scope,
          field.initializerNode
        );
      }
      fixupField(classDef, field);
    }

    const methods = classDef.methods.slice();
    if (classDef.cctor) {
      methods.push(classDef.cctor);
    }
    if (classDef.ctor) {
      methods.push(classDef.ctor);
    }
    for (const method of methods) {
      for (const param of method.params) {
        if (param.initializerNode) {
          param.defaultValue = translateExpression(
            classDef.scope,
            param.initializerNode
          );
        }
      }
      if (method.bodyNode) {
        method.body = translateBlock(method.scope, method.bodyNode);
      }
      fixupMethod(classDef, method);
    }
  }
}

export function translateBlock(scope: Scope, nodeBlock: Node): ast.NodeBlock {
  const statements: ast.NodeStatement[] = [];
  for (const nodeStatement of nodeBlock.findChildren(terms.Statement)) {
    try {
      const s = translateStatement(scope, nodeStatement);
      statements.push(s);
    } catch (err) {
      statements.push(new ast.NodeError(err));
    }
  }
  return new ast.NodeBlock(statements);
}

export function translateStatement(
  scope: Scope,
  nodeStatement: Node
): ast.NodeStatement {
  let node: Node | null;
  if ((node = nodeStatement.findChild(terms.Block))) {
    return translateBlock(scope, node);
  } else if ((node = nodeStatement.findChild(terms.ExpressionStatement))) {
    const nodeExpression = node.findChild(terms.Expression);
    if (!nodeExpression) {
      throw new Error("Invalid expression statement");
    }
    const expression = translateExpression(scope, nodeExpression);
    return new ast.NodeStmtExpr(expression);
  } else if ((node = nodeStatement.findChild(terms.LabeledStatement))) {
    const nodeLabel = node.findChild(terms.Label);
    const nodeStatement = node.findChild(terms.Statement);
    if (!nodeLabel || !nodeStatement) {
      throw new Error("Invalid labeled statement");
    }
    const statement = translateStatement(scope, nodeStatement);
    return new ast.NodeStmtLabel(nodeLabel.text, statement);
  } else if ((node = nodeStatement.findChild(terms.VariableDeclaration))) {
    const nodeBindings = node.findChildren(terms.VariableBinding);
    const bindings: ast.VariableBinding[] = [];
    for (const b of nodeBindings) {
      const nodeName = b.findChild(terms.VariableDefinition);
      if (!nodeName) {
        throw new Error("Invalid variable binding");
      }

      let type: TypeRef = { kind: TypeRefKind.Any };
      let nodeType = b.findChild(terms.TypeAnnotation)?.findChild(terms.Type);
      if (nodeType) {
        type = translateType(scope, nodeType);
      }

      let initialValue: ast.NodeExpression | null = null;
      let nodeInitializer = b.findChild(terms.Expression);
      if (nodeInitializer) {
        initialValue = translateExpression(scope, nodeInitializer);
      }

      bindings.push({ name: nodeName.text, type, initialValue });
      scope.declaredVariables.push(nodeName.text);
    }
    if (bindings.length === 0) {
      throw new Error("No bindings in variable declaration");
    }
    return new ast.NodeStmtVarDecl(bindings);
  } else if ((node = nodeStatement.findChild(terms.DebuggerStatement))) {
    return new ast.NodeStmtDebugger();
  } else if ((node = nodeStatement.findChild(terms.ContinueStatement))) {
    const nodeLabel = node.findChild(terms.Label);
    return new ast.NodeStmtContinue(nodeLabel?.text ?? null);
  } else if ((node = nodeStatement.findChild(terms.BreakStatement))) {
    const nodeLabel = node.findChild(terms.Label);
    return new ast.NodeStmtBreak(nodeLabel?.text ?? null);
  } else if ((node = nodeStatement.findChild(terms.ThrowStatement))) {
    const nodeExpression = node.findChild(terms.Expression);
    if (!nodeExpression) {
      throw new Error("Invalid throw statement");
    }
    const expression = translateExpression(scope, nodeExpression);
    return new ast.NodeStmtThrow(expression);
  } else if ((node = nodeStatement.findChild(terms.ReturnStatement))) {
    let expression: ast.NodeExpression | null = null;
    const nodeExpression = node.findChild(terms.Expression);
    if (nodeExpression) {
      expression = translateExpression(scope, nodeExpression);
    }
    return new ast.NodeStmtReturn(expression);
  } else if ((node = nodeStatement.findChild(terms.TryStatement))) {
    const nodeBlocks = node.findChildren(terms.Block);
    const nodeExceptionVar = node.findChild(terms.VariableDefinition);
    if (nodeBlocks.length !== 2 || !nodeExceptionVar) {
      throw new Error("Invalid try statement");
    }
    const tryBlock = translateBlock(scope, nodeBlocks[0]);
    const catchBlock = translateBlock(scope, nodeBlocks[1]);
    return new ast.NodeStmtTry(tryBlock, catchBlock, nodeExceptionVar.text);
  } else if ((node = nodeStatement.findChild(terms.SwitchStatement))) {
    const nodeCondition = node
      .findChild(terms.ParenthesizedExpression)
      ?.findChild(terms.Expression);
    const nodeItems = node.findChildren(terms.SwitchItem);
    if (!nodeCondition) {
      throw new Error("Invalid switch statement");
    }

    const condition = translateExpression(scope, nodeCondition);

    const items: ast.SwitchItem[] = [];
    for (const nodeItem of nodeItems) {
      let nodeCase = nodeItem.findChild(terms.CaseLabel);
      let nodeDefault = nodeItem.findChild(terms.DefaultLabel);
      let value: ast.NodeExpression | null;
      if (nodeCase) {
        const nodeValue = nodeCase.findChild(terms.Expression);
        if (!nodeValue) {
          throw new Error("Invalid switch case");
        }
        value = translateExpression(scope, nodeValue);
      } else if (nodeDefault) {
        value = null;
      } else {
        continue;
      }

      const nodeStatements = nodeItem.findChildren(terms.Statement);
      const statements: ast.NodeStatement[] = [];
      for (const nodeStatement of nodeStatements) {
        try {
          const s = translateStatement(scope, nodeStatement);
          statements.push(s);
        } catch (err) {
          statements.push(new ast.NodeError(err));
        }
      }

      items.push({ value, statements });
    }

    return new ast.NodeStmtSwitch(condition, items);
  } else if ((node = nodeStatement.findChild(terms.IfStatement))) {
    const nodeCondition = node
      .findChild(terms.ParenthesizedExpression)
      ?.findChild(terms.Expression);
    const nodeStatements = node.findChildren(terms.Statement);
    if (!nodeCondition || nodeStatements.length === 0) {
      throw new Error("Invalid if statement");
    }

    const condition = translateExpression(scope, nodeCondition);
    const trueBody = translateStatement(scope, nodeStatements[0]);
    let falseBody: ast.NodeStatement | null = null;
    if (nodeStatements[1]) {
      falseBody = translateStatement(scope, nodeStatements[1]);
    }
    return new ast.NodeStmtIf(condition, trueBody, falseBody);
  } else if ((node = nodeStatement.findChild(terms.DoStatement))) {
    const nodeCondition = node
      .findChild(terms.ParenthesizedExpression)
      ?.findChild(terms.Expression);
    const nodeStatement = node.findChild(terms.Statement);
    if (!nodeCondition || !nodeStatement) {
      throw new Error("Invalid do statement");
    }

    const condition = translateExpression(scope, nodeCondition);
    const body = translateStatement(scope, nodeStatement);
    return new ast.NodeStmtDo(condition, body);
  } else if ((node = nodeStatement.findChild(terms.WhileStatement))) {
    const nodeCondition = node
      .findChild(terms.ParenthesizedExpression)
      ?.findChild(terms.Expression);
    const nodeStatement = node.findChild(terms.Statement);
    if (!nodeCondition || !nodeStatement) {
      throw new Error("Invalid while statement");
    }

    const condition = translateExpression(scope, nodeCondition);
    const body = translateStatement(scope, nodeStatement);
    return new ast.NodeStmtWhile(condition, body);
  } else if ((node = nodeStatement.findChild(terms.ForStatement))) {
    const nodeStatement = node.findChild(terms.Statement);
    if (!nodeStatement) {
      throw new Error("Invalid for statement");
    }

    let nodeSpec: Node | null;
    let factory: (body: ast.NodeStatement) => ast.NodeStatement;
    if ((nodeSpec = node.findChild(terms.ForSpec))) {
      const nodeInitializer = nodeSpec.findChild(terms.ForInitializer);
      const nodeCondition = nodeSpec
        .findChild(terms.ForCondition)
        ?.findChild(terms.Expression);
      const nodeNext = nodeSpec
        .findChild(terms.ForNext)
        ?.findChild(terms.Expression);
      if (!nodeInitializer) {
        throw new Error("Invalid for loop spec");
      }

      let initializer: ast.ASTNode | null = null;
      let nodeInitializerBody: Node | null;
      if (
        (nodeInitializerBody = nodeInitializer.findChild(
          terms.VariableDeclaration
        ))
      ) {
        initializer = translateStatement(scope, nodeInitializer);
      } else if (
        (nodeInitializerBody = nodeInitializer.findChild(terms.Expression))
      ) {
        initializer = translateExpression(scope, nodeInitializerBody);
      }
      const condition =
        (nodeCondition && translateExpression(scope, nodeCondition)) ?? null;
      const next = (nodeNext && translateExpression(scope, nodeNext)) ?? null;

      factory = (body) =>
        new ast.NodeStmtFor(initializer, condition, next, body);
    } else if ((nodeSpec = node.findChild(terms.ForInSpec))) {
      const isEach = !!nodeSpec.findNamedChild("each");
      const nodeList = nodeSpec.findChild(terms.Expression);
      const nodeVarDecl = nodeSpec.findChild(terms.VariableDefinition);
      const nodeVarRef = nodeSpec.findChild(terms.VariableName);
      if (!nodeList) {
        throw new Error("Invalid for-in loop spec");
      }

      const listValue = translateExpression(scope, nodeList);

      let variable: ast.ASTNode;
      if (nodeVarDecl) {
        variable = new ast.NodeStmtVarDecl([
          {
            name: nodeVarDecl.text,
            type: { kind: TypeRefKind.Any },
            initialValue: null,
          },
        ]);
        scope.declaredVariables.push(nodeVarDecl.text);
      } else if (nodeVarRef) {
        variable = translateExpression(scope, nodeSpec);
      } else {
        throw new Error("Invalid for-in variable spec");
      }

      factory = (body) =>
        new ast.NodeStmtForIn(variable, listValue, isEach ? "of" : "in", body);
    } else {
      throw new Error("Invalid for statement spec");
    }

    const body = translateStatement(scope, nodeStatement);

    return factory(body);
  }

  throw new Error("Unexpected statement node instance");
}

export function translateExpression(
  scope: Scope,
  nodeExpression: Node
): ast.NodeExpression {
  let node: Node | null;
  if ((node = nodeExpression.findChild(terms.Number))) {
    const value = JSON5.parse(node.text);
    if (typeof value !== "number") {
      throw new Error("Cannot parse constant number");
    }
    return new ast.NodeExprConst(value);
  } else if ((node = nodeExpression.findChild(terms.String))) {
    const value = JSON5.parse(node.text);
    if (typeof value !== "string") {
      throw new Error("Cannot parse constant string");
    }
    return new ast.NodeExprConst(value);
  } else if ((node = nodeExpression.findChild(terms.BooleanLiteral))) {
    const value = JSON5.parse(node.text);
    if (typeof value !== "boolean") {
      throw new Error("Cannot parse constant string");
    }
    return new ast.NodeExprConst(value);
  } else if ((node = nodeExpression.findChild(terms.RegExp))) {
    const match = /^\/(.+)\/([^\/]*)$/.exec(node.text);
    if (!match) {
      throw new Error("Cannot parse constant RegExp");
    }
    return new ast.NodeExprConst(new RegExp(match[1], match[2]));
  } else if ((node = nodeExpression.findNamedChild("null"))) {
    return new ast.NodeExprConst(null);
  } else if ((node = nodeExpression.findNamedChild("undefined"))) {
    return new ast.NodeExprConst(undefined);
  } else if ((node = nodeExpression.findNamedChild("this"))) {
    return new ast.NodeExprThis();
  } else if ((node = nodeExpression.findNamedChild("super"))) {
    return new ast.NodeExprSuper();
  } else if ((node = nodeExpression.findChild(terms.ParenthesizedExpression))) {
    const nodeExpr = node.findChild(terms.Expression);
    if (!nodeExpr) {
      throw new Error("Invalid parenthesized expression");
    }

    return translateExpression(scope, nodeExpr);
  } else if ((node = nodeExpression.findChild(terms.VariableName))) {
    const name = node.text;
    return translateVarType(scope, name);
  } else if ((node = nodeExpression.findChild(terms.ArrayExpression))) {
    const nodeItems = node.findChildren(terms.Expression);
    const items: ast.NodeExpression[] = [];
    for (const nodeItem of nodeItems) {
      const e = translateExpression(scope, nodeItem);
      items.push(e);
    }
    return new ast.NodeExprLiteralArray(items);
  } else if ((node = nodeExpression.findChild(terms.ObjectExpression))) {
    const nodeProperties = node.findChildren(terms.Property);
    const entries: ast.ObjectLiteralEntry[] = [];
    for (const nodeProperty of nodeProperties) {
      const nodeValue = nodeProperty.findChild(terms.Expression);
      if (!nodeValue) {
        throw new Error("Invalid object expression value");
      }
      const value = translateExpression(scope, nodeValue);

      let keyNode: Node | null;
      let key: ast.NodeExpression;
      if ((keyNode = nodeProperty.findChild(terms.PropertyNameDefinition))) {
        key = new ast.NodeExprConst(keyNode.text);
      } else if ((keyNode = nodeProperty.findChild(terms.String))) {
        key = new ast.NodeExprConst(JSON.parse(keyNode.text));
      } else if ((keyNode = nodeProperty.findChild(terms.Number))) {
        key = new ast.NodeExprConst(JSON.parse(keyNode.text));
      } else {
        throw new Error("Invalid object expression key");
      }

      entries.push({ key, value });
    }
    return new ast.NodeExprLiteralObject(entries);
  } else if ((node = nodeExpression.findChild(terms.MemberExpression))) {
    const nodeTarget = node.findChild(terms.Expression);
    const nodePath = node.findChild(terms.MemberPath);
    if (!nodeTarget || !nodePath) {
      throw new Error("Invalid member expression");
    }

    const target = translateExpression(scope, nodeTarget);

    let nodePathInstance: Node | null;
    if ((nodePathInstance = nodePath.findChild(terms.PropertyName))) {
      return new ast.NodeExprProperty(target, nodePathInstance.text);
    } else if ((nodePathInstance = nodePath.findChild(terms.Expression))) {
      const indexer = translateExpression(scope, nodePathInstance);
      return new ast.NodeExprIndexer(target, indexer);
    } else {
      throw new Error("Invalid member expression indexer");
    }
  } else if ((node = nodeExpression.findChild(terms.NewExpression))) {
    const nodeType = node.findChild(terms.Type);
    const nodeArgs = node.findChild(terms.ArgList);
    if (!nodeType || !nodeArgs) {
      throw new Error("Invalid new expression");
    }

    let nodeTypeName = nodeType.findChild(terms.TypeName);
    let type: ast.NodeExpression;
    if (nodeTypeName) {
      type = translateVarType(scope, nodeTypeName.text);
    } else {
      type = new ast.NodeExprType(translateType(scope, nodeType), true);
    }
    const args = translateArgs(scope, nodeArgs);

    return new ast.NodeExprNew(type, args);
  } else if ((node = nodeExpression.findChild(terms.CallExpression))) {
    const nodeFn = node.findChild(terms.Expression);
    const nodeArgs = node.findChild(terms.ArgList);
    if (!nodeFn || !nodeArgs) {
      throw new Error("Invalid call expression");
    }

    const fn = translateExpression(scope, nodeFn);
    const args = translateArgs(scope, nodeArgs);

    return new ast.NodeExprCall(fn, args);
  } else if ((node = nodeExpression.findChild(terms.UnaryExpression))) {
    const nodeOp = node.findChild(terms.UnaryOp);
    const nodeOperand = node.findChild(terms.Expression);
    if (!nodeOp || !nodeOperand) {
      throw new Error("Invalid unary expression");
    }

    const operand = translateExpression(scope, nodeOperand);
    return new ast.NodeExprUnary(nodeOp.text, operand);
  } else if ((node = nodeExpression.findChild(terms.PostfixExpression))) {
    const nodeOp = node.findChild(terms.PostfixOp);
    const nodeOperand = node.findChild(terms.Expression);
    if (!nodeOp || !nodeOperand) {
      throw new Error("Invalid postfix expression");
    }

    const operand = translateExpression(scope, nodeOperand);
    return new ast.NodeExprPostfix(nodeOp.text, operand);
  } else if ((node = nodeExpression.findChild(terms.BinaryExpression))) {
    if (node.findNamedChild("as")) {
      const nodeOperand = node.findChild(terms.Expression);
      const nodeType = node.findChild(terms.Type);
      if (!nodeOperand || !nodeType) {
        throw new Error("Invalid as expression");
      }

      const type = translateType(scope, nodeType);
      const operand = translateExpression(scope, nodeOperand);
      return new ast.NodeExprBinary(
        "as",
        operand,
        new ast.NodeExprType(type, false)
      );
    } else {
      const nodeOperands = node.findChildren(terms.Expression);
      if (nodeOperands.length !== 2) {
        throw new Error("Invalid binary expression");
      }
      const nodeOp = node.children.find((n) => n.type.id !== terms.Expression);
      if (!nodeOp) {
        throw new Error("Invalid binary expression operator");
      }

      let op = nodeOp.text;
      if (op === "is") {
        op = "instanceof";
      }
      const operandA = translateExpression(scope, nodeOperands[0]);
      const operandB = translateExpression(scope, nodeOperands[1]);
      return new ast.NodeExprBinary(op, operandA, operandB);
    }
  } else if ((node = nodeExpression.findChild(terms.ConditionalExpression))) {
    const nodeOperands = node.findChildren(terms.Expression);
    if (nodeOperands.length !== 3) {
      throw new Error("Invalid ternary expression");
    }

    const condition = translateExpression(scope, nodeOperands[0]);
    const trueValue = translateExpression(scope, nodeOperands[1]);
    const falseValue = translateExpression(scope, nodeOperands[2]);
    return new ast.NodeExprTernary(condition, trueValue, falseValue);
  } else if ((node = nodeExpression.findChild(terms.AssignmentExpression))) {
    const nodeValue = node.findChild(terms.Expression);
    const nodeOp = node.findChild(terms.AssignmentOp);
    if (!nodeValue || !nodeOp) {
      throw new Error("Invalid assignment expression");
    }

    const op = nodeOp.text;
    const target = translateExpression(scope, node);
    const value = translateExpression(scope, nodeValue);

    return new ast.NodeExprAssignment(op, target, value);
  }

  throw new Error("Unexpected expression node instance");
}

function translateVarType(scope: Scope, name: string): ast.NodeExpression {
  const kind = scope.resolveVariableKind(name);
  switch (kind) {
    case VariableKind.Intrinsic:
      return new ast.NodeExprProperty(
        new ast.NodeExprType(
          {
            kind: TypeRefKind.Class,
            namespace: "_internal.avm2",
            name: "Runtime",
          },
          true
        ),
        name
      );
    case VariableKind.Class:
      return new ast.NodeExprProperty(new ast.NodeExprThis(), name);
    case VariableKind.Type:
      return new ast.NodeExprType(scope.resolveType(name), true);
    default:
      return new ast.NodeExprVariable(name);
  }
}

function translateArgs(scope: Scope, nodeArgs: Node): ast.NodeExpression[] {
  const nodeExprs = nodeArgs.findChildren(terms.Expression);
  const exprs: ast.NodeExpression[] = [];
  for (const nodeExpr of nodeExprs) {
    const e = translateExpression(scope, nodeExpr);
    if (e) {
      exprs.push(e);
    }
  }
  return exprs;
}
