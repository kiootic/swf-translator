import {
  ClassDef,
  FieldDef,
  Visibility,
  MethodDef,
  MethodKind,
  ParamDef,
} from "../code/structure";
import { EmitContext } from "./context";

export function emitClass(cls: ClassDef): string {
  const ctx = new EmitContext(cls);

  ctx.emit("export");
  if (cls.isInterface) {
    ctx.emit(" abstract");
  }
  ctx.emit(` class ${cls.name}`);
  if (cls.extendType) {
    ctx.emit(` extends ${ctx.importType(cls.extendType)}`);
  }
  if (cls.implementTypes.length > 0) {
    ctx.emit(
      ` implements ${cls.implementTypes
        .map((t) => ctx.importType(t))
        .join(", ")}`
    );
  }
  ctx.emitLine(" {");

  const fields = cls.fields.slice();
  fields.sort((a, b) => a.name.localeCompare(b.name));
  for (const field of fields) {
    emitField(ctx, field);
  }

  if (cls.ctor) {
    emitCtor(ctx, cls.ctor);
  }
  if (cls.cctor) {
    emitCctor(ctx, cls.cctor);
  }

  const methods = cls.methods.slice();
  methods.sort((a, b) =>
    `${a.name}|${a.kind}`.localeCompare(`${b.name}|${b.kind}`)
  );
  for (const method of methods) {
    emitMethod(ctx, method);
  }

  ctx.emitLine("}");

  return ctx.toString();
}

function emitVisibility(ctx: EmitContext, v: Visibility) {
  switch (v) {
    case Visibility.Private:
      ctx.emit("private ");
      break;
    case Visibility.Protected:
      ctx.emit("protected ");
      break;
    default:
      ctx.emit("public ");
      break;
  }
}

function emitField(ctx: EmitContext, field: FieldDef) {
  emitVisibility(ctx, field.visibility);
  if (field.isStatic) {
    ctx.emit("static ");
  }
  if (field.isReadonly) {
    ctx.emit("readonly ");
  }
  ctx.emit(`${field.name}: ${ctx.importType(field.type)}`);
  if (field.initialValue) {
    // TODO: emit AST
    ctx.emit(" = {} as any");
  }
  ctx.emitLine(";");
  ctx.emitLine();
}

function emitMethod(ctx: EmitContext, method: MethodDef) {
  emitVisibility(ctx, method.visibility);
  if (method.isStatic) {
    ctx.emit("static ");
  }
  if (ctx.classDef.isInterface) {
    ctx.emit("abstract ");
  }
  if (method.kind === MethodKind.Getter) {
    ctx.emit("get ");
  } else if (method.kind === MethodKind.Setter) {
    ctx.emit("set ");
  }
  ctx.emit(method.name);
  emitParams(ctx, method.params);
  if (method.kind !== MethodKind.Setter) {
    ctx.emit(`: ${ctx.importType(method.returnType)}`);
  }
  if (method.body) {
    // TODO: emit AST
    ctx.emitLine(`{throw "not implemented";}`);
  } else {
    ctx.emitLine(";");
  }
  ctx.emitLine();
}

function emitCtor(ctx: EmitContext, method: MethodDef) {
  emitVisibility(ctx, method.visibility);
  ctx.emit("constructor");
  emitParams(ctx, method.params);
  if (method.body) {
    // TODO: emit AST
    ctx.emitLine(
      `{${ctx.classDef.extendType ? "super();" : ""}throw "not implemented";}`
    );
  } else {
    ctx.emitLine(";");
  }
  ctx.emitLine();
}

function emitCctor(ctx: EmitContext, method: MethodDef) {
  emitVisibility(ctx, method.visibility);
  ctx.emit("static __cctor()");
  if (method.body) {
    // TODO: emit AST
    ctx.emitLine(`{throw "not implemented";}`);
  } else {
    ctx.emitLine(";");
  }
  ctx.emitLine();
}

function emitParams(ctx: EmitContext, params: ParamDef[]) {
  ctx.emit("(");
  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    if (i !== 0) {
      ctx.emit(", ");
    }

    if (param.isRest) {
      ctx.emit("...");
    }
    const isOptional = ctx.classDef.isInterface && param.defaultValue;
    ctx.emit(
      `${param.name}${isOptional ? "?" : ""}: ${ctx.importType(param.type)}`
    );
    if (!ctx.classDef.isInterface && param.defaultValue) {
      // TODO: emit AST
      ctx.emit(" = {} as any");
    }
  }
  ctx.emit(")");
}
