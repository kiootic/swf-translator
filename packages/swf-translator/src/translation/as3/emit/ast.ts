import { EmitContext } from "./context";
import * as ast from "../code/ast";

export function emitAST(ctx: EmitContext, node: ast.ASTNode) {
  if (node instanceof ast.NodeError) {
    ctx.emitLine(`{ /* ERROR: ${node.error} */ }`);
  } else if (node instanceof ast.NodeBlock) {
    ctx.emitLine("{");
    for (const s of node.statements) {
      emitAST(ctx, s);
    }
    ctx.emitLine("}");
  } else if (node instanceof ast.NodeStmtExpr) {
    emitAST(ctx, node.expression);
    ctx.emitLine(";");
  } else if (node instanceof ast.NodeStmtLabel) {
    ctx.emit(`${node.label}: `);
    emitAST(ctx, node.statement);
  } else if (node instanceof ast.NodeStmtVarDecl) {
    emitVarDecl(ctx, node, true, true);
  } else if (node instanceof ast.NodeStmtDebugger) {
    ctx.emitLine("debugger;");
  } else if (node instanceof ast.NodeStmtContinue) {
    ctx.emitLine(`continue${node.label == null ? "" : " " + node.label}; `);
  } else if (node instanceof ast.NodeStmtBreak) {
    ctx.emitLine(`break${node.label == null ? "" : " " + node.label}; `);
  } else if (node instanceof ast.NodeStmtThrow) {
    ctx.emit("throw ");
    emitAST(ctx, node.expression);
    ctx.emitLine(";");
  } else if (node instanceof ast.NodeStmtReturn) {
    ctx.emit("return");
    if (node.expression) {
      ctx.emit(" ");
      emitAST(ctx, node.expression);
    }
    ctx.emitLine(";");
  } else if (node instanceof ast.NodeStmtTry) {
    ctx.emitLine("try");
    emitAST(ctx, node.tryBlock);
    ctx.emitLine(`catch (${node.exceptionVar})`);
    emitAST(ctx, node.catchBlock);
  } else if (node instanceof ast.NodeStmtSwitch) {
    ctx.emit("switch (");
    emitAST(ctx, node.condition);
    ctx.emitLine(") {");
    for (const item of node.items) {
      if (item.value) {
        ctx.emit("case ");
        emitAST(ctx, item.value);
        ctx.emitLine(":");
      } else {
        ctx.emitLine("default:");
      }
      for (const statement of item.statements) {
        emitAST(ctx, statement);
      }
    }
    ctx.emitLine("}");
  } else if (node instanceof ast.NodeStmtIf) {
    ctx.emit("if (");
    emitAST(ctx, node.condition);
    ctx.emitLine(")");
    emitAST(ctx, node.trueBody);
    if (node.falseBody) {
      ctx.emitLine("else");
      emitAST(ctx, node.falseBody);
    }
  } else if (node instanceof ast.NodeStmtDo) {
    ctx.emitLine("do");
    emitAST(ctx, node.body);
    ctx.emit("while (");
    emitAST(ctx, node.condition);
    ctx.emitLine(");");
  } else if (node instanceof ast.NodeStmtWhile) {
    ctx.emit("while (");
    emitAST(ctx, node.condition);
    ctx.emitLine(")");
    emitAST(ctx, node.body);
  } else if (node instanceof ast.NodeStmtFor) {
    ctx.emit("for (");
    if (node.initializer instanceof ast.NodeStmtVarDecl) {
      emitVarDecl(ctx, node.initializer, false, true);
    } else if (node.initializer) {
      emitAST(ctx, node.initializer);
    }
    ctx.emit("; ");
    if (node.condition) {
      emitAST(ctx, node.condition);
    }
    ctx.emit("; ");
    if (node.next) {
      emitAST(ctx, node.next);
    }
    ctx.emitLine(")");
    emitAST(ctx, node.body);
  } else if (node instanceof ast.NodeStmtForIn) {
    ctx.emit("for (");
    if (node.variable instanceof ast.NodeStmtVarDecl) {
      emitVarDecl(ctx, node.variable, false, false);
    } else if (node.variable) {
      emitAST(ctx, node.variable);
    }
    ctx.emit(` ${node.type} `);
    emitAST(ctx, node.value);
    ctx.emit(")");
    emitAST(ctx, node.body);
  } else if (node instanceof ast.NodeExprConst) {
    if (typeof node.value === "undefined") {
      ctx.emit("undefined");
    } else if (node.value instanceof RegExp) {
      ctx.emit(node.value.toString());
    } else {
      ctx.emit(JSON.stringify(node.value));
    }
  } else if (node instanceof ast.NodeExprThis) {
    ctx.emit("this");
  } else if (node instanceof ast.NodeExprSuper) {
    ctx.emit("super");
  } else if (node instanceof ast.NodeExprType) {
    ctx.emit(ctx.importType(node.type, node.isValue));
  } else if (node instanceof ast.NodeExprProperty) {
    ctx.emit("(");
    emitAST(ctx, node.object);
    ctx.emit(`.${node.name})`);
  } else if (node instanceof ast.NodeExprIndexer) {
    ctx.emit("(");
    emitAST(ctx, node.object);
    ctx.emit("[");
    emitAST(ctx, node.index);
    ctx.emit("])");
  } else if (node instanceof ast.NodeExprVariable) {
    ctx.emit(node.name);
  } else if (node instanceof ast.NodeExprLiteralObject) {
    ctx.emit("({");
    for (let i = 0; i < node.entries.length; i++) {
      const { key, value } = node.entries[i];
      if (i !== 0) {
        ctx.emit(", ");
      }
      emitAST(ctx, key);
      ctx.emit(": ");
      emitAST(ctx, value);
    }
    ctx.emit("})");
  } else if (node instanceof ast.NodeExprLiteralArray) {
    ctx.emit("([");
    for (let i = 0; i < node.items.length; i++) {
      const item = node.items[i];
      if (i !== 0) {
        ctx.emit(", ");
      }
      emitAST(ctx, item);
    }
    ctx.emit("])");
  } else if (node instanceof ast.NodeExprNew) {
    ctx.emit("(");
    ctx.emit("new ");
    emitAST(ctx, node.type);
    ctx.emit("(");
    for (let i = 0; i < node.args.length; i++) {
      const arg = node.args[i];
      if (i !== 0) {
        ctx.emit(", ");
      }
      emitAST(ctx, arg);
    }
    ctx.emit("))");
  } else if (node instanceof ast.NodeExprCall) {
    ctx.emit("(");
    emitAST(ctx, node.fn);
    ctx.emit("(");
    for (let i = 0; i < node.args.length; i++) {
      const arg = node.args[i];
      if (i !== 0) {
        ctx.emit(", ");
      }
      emitAST(ctx, arg);
    }
    ctx.emit("))");
  } else if (node instanceof ast.NodeExprUnary) {
    ctx.emit("(");
    ctx.emit(node.op);
    ctx.emit(" ");
    emitAST(ctx, node.operand);
    ctx.emit(")");
  } else if (node instanceof ast.NodeExprPostfix) {
    ctx.emit("(");
    emitAST(ctx, node.operand);
    ctx.emit(" ");
    ctx.emit(node.op);
    ctx.emit(")");
  } else if (node instanceof ast.NodeExprBinary) {
    ctx.emit("(");
    emitAST(ctx, node.operandA);
    ctx.emit(" ");
    ctx.emit(node.op);
    ctx.emit(" ");
    emitAST(ctx, node.operandB);
    ctx.emit(")");
  } else if (node instanceof ast.NodeExprTernary) {
    ctx.emit("(");
    emitAST(ctx, node.condition);
    ctx.emit("?");
    emitAST(ctx, node.trueValue);
    ctx.emit(":");
    emitAST(ctx, node.falseValue);
    ctx.emit(")");
  } else if (node instanceof ast.NodeExprAssignment) {
    ctx.emit("(");
    emitAST(ctx, node.target);
    ctx.emit(" ");
    ctx.emit(node.op);
    ctx.emit(" ");
    emitAST(ctx, node.value);
    ctx.emit(")");
  } else {
    throw new Error("Unexpected AST node");
  }
}

function emitVarDecl(
  ctx: EmitContext,
  node: ast.NodeStmtVarDecl,
  semi: boolean,
  withType: boolean
) {
  ctx.emit("var ");
  for (let i = 0; i < node.bindings.length; i++) {
    const binding = node.bindings[i];
    if (i !== 0) {
      ctx.emitLine(", ");
    }
    ctx.emit(binding.name);
    if (withType) {
      ctx.emit(`: ${ctx.importType(binding.type, false)}`);
    }
    if (binding.initialValue) {
      ctx.emit(" = ");
      emitAST(ctx, binding.initialValue);
    }
  }
  if (semi) {
    ctx.emitLine(";");
  }
}
