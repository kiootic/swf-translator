import * as ast from "./code/ast";
import { ClassDef, MethodDef, FieldDef } from "./code/structure";
import { TypeRefKind } from "./code/type-ref";

export function fixupField(classDef: ClassDef, fieldDef: FieldDef) {
  fixupTypeAnnotations(fieldDef);
}

export function fixupMethod(classDef: ClassDef, methodDef: MethodDef) {
  if (methodDef.body) {
    fixupSuperCall(classDef, methodDef.body);
    fixupStringConstructor(methodDef.body);
    fixupInstanceOf(methodDef, methodDef.body);
    fixupCast(methodDef.body);
  }
  fixupTypeAnnotations(methodDef);
}

function fixupSuperCall(classDef: ClassDef, body: ast.NodeBlock) {
  let superCall: ast.NodeStatement | null = null;
  for (const statement of body.statements) {
    if (
      statement instanceof ast.NodeStmtExpr &&
      statement.expression instanceof ast.NodeExprCall &&
      statement.expression.fn instanceof ast.NodeExprSuper
    ) {
      superCall = statement;
      break;
    }
  }
  if (!superCall) {
    return;
  }
  const i = body.statements.indexOf(superCall);
  body.statements.splice(i, 1);
  if (classDef.extendType) {
    body.statements.splice(0, 0, superCall);
  }
}

function fixupStringConstructor(body: ast.NodeBlock) {
  body.walk((node) => {
    if (
      node instanceof ast.NodeExprNew &&
      node.type instanceof ast.NodeExprType
    ) {
      if (node.type.type.kind === TypeRefKind.String) {
        return new ast.NodeExprConst("");
      }
    }
  });
}

function fixupTypeAnnotations(def: MethodDef | FieldDef) {
  if (def instanceof FieldDef) {
    if (def.type.kind === TypeRefKind.Object) {
      def.type = { kind: TypeRefKind.Any };
    }
  } else if (def instanceof MethodDef) {
    for (const param of def.params) {
      if (param.isRest) {
        param.type = {
          kind: TypeRefKind.Array,
          elementType: { kind: TypeRefKind.Any },
        };
      } else if (param.type.kind === TypeRefKind.Object) {
        param.type = { kind: TypeRefKind.Any };
      }
    }
    if (def.returnType.kind === TypeRefKind.Object) {
      def.returnType = { kind: TypeRefKind.Any };
    }

    def.body?.walk((node) => {
      if (node instanceof ast.NodeStmtVarDecl) {
        for (const binding of node.bindings) {
          if (binding.type.kind === TypeRefKind.Object) {
            binding.type = { kind: TypeRefKind.Any };
          }
        }
      }
    });
  }
}

function fixupInstanceOf(methodDef: MethodDef, body: ast.NodeBlock) {
  body.walk((node) => {
    if (
      node instanceof ast.NodeExprBinary &&
      node.op === "instanceof" &&
      node.operandB instanceof ast.NodeExprType
    ) {
      if (node.operandB.type.kind === TypeRefKind.String) {
        return new ast.NodeExprBinary(
          "===",
          new ast.NodeExprUnary("typeof", node.operandA),
          new ast.NodeExprConst("string")
        );
      } else if (node.operandB.type.kind === TypeRefKind.Number) {
        return new ast.NodeExprBinary(
          "===",
          new ast.NodeExprUnary("typeof", node.operandA),
          new ast.NodeExprConst("number")
        );
      } else if (node.operandB.type.kind === TypeRefKind.Boolean) {
        return new ast.NodeExprBinary(
          "===",
          new ast.NodeExprUnary("typeof", node.operandA),
          new ast.NodeExprConst("boolean")
        );
      } else if (node.operandB.type.kind === TypeRefKind.Array) {
        return new ast.NodeExprCall(
          new ast.NodeExprProperty(
            new ast.NodeExprVariable("Array"),
            "isArray"
          ),
          [node.operandA]
        );
      } else if (node.operandB.type.kind === TypeRefKind.Class) {
        const { namespace, name } = node.operandB.type;
        const classDef = methodDef.scope.context.resolveClass(namespace, name);
        if (classDef && classDef.isInterface) {
          return new ast.NodeExprCall(
            new ast.NodeExprProperty(
              new ast.NodeExprType(
                {
                  kind: TypeRefKind.Class,
                  namespace: "_internal.avm2",
                  name: "Runtime",
                },
                true
              ),
              "isInterface"
            ),
            [node.operandA, node.operandB]
          );
        }
      }
    }
  });
}

function fixupCast(body: ast.NodeBlock) {
  body.walk((node) => {
    if (
      node instanceof ast.NodeExprCall &&
      node.fn instanceof ast.NodeExprType &&
      node.args.length === 1 &&
      node.fn.type.kind === TypeRefKind.Class
    ) {
      return new ast.NodeExprBinary("as", node.args[0], node.fn);
    }
  });
}
