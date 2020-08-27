import { AS3Context } from "../context";
import { TypeRef, TypeRefClass, TypeRefKind } from "./type-ref";
import type { ClassDef, MethodDef } from "./structure";

export enum VariableKind {
  Intrinsic = "intrinsic",
  Global = "global",
  Type = "type",
  Class = "class",
  Local = "local",
}

export class Scope {
  packageName?: string;
  classDef?: ClassDef;
  methodDef?: MethodDef;
  readonly importedPackages: string[] = [];
  readonly importedTypes: TypeRefClass[] = [];
  readonly declaredVariables: string[] = [];

  constructor(readonly context: AS3Context, readonly parent: Scope | null) {}

  child(): Scope {
    const scope = new Scope(this.context, this);
    scope.packageName = this.packageName;
    scope.classDef = this.classDef;
    scope.methodDef = this.methodDef;
    return scope;
  }

  resolveType(name: string): TypeRef {
    let type: TypeRef | null = null;
    let scope: Scope | null = this;
    while (scope) {
      type = scope.resolveLocalType(name);
      if (type) {
        break;
      }
      scope = scope.parent;
    }
    if (!type) {
      type = this.resolveRootType(name);
    }
    if (!type) {
      throw new Error(`Cannot resolve type: ${name}`);
    }
    return type;
  }

  private resolveLocalType(name: string): TypeRef | null {
    const importedType = this.importedTypes.find((t) => t.name === name);
    if (importedType) {
      return importedType;
    }

    const packages = this.importedPackages.slice();
    if (this.packageName != null) {
      const parts = this.packageName.split(".");
      for (let i = 0; i <= parts.length; i++) {
        packages.push(parts.slice(0, i).join("."));
      }
    }
    for (const p of packages) {
      const cls = this.context.resolveClass(p, name);
      if (!cls) {
        continue;
      }
      return {
        kind: TypeRefKind.Class,
        namespace: cls.namespace,
        name: cls.name,
      };
    }

    return null;
  }

  private resolveRootType(name: string): TypeRef | null {
    switch (name) {
      case "Object":
        return { kind: TypeRefKind.Object };
      case "String":
        return { kind: TypeRefKind.String };
      case "Number":
      case "int":
      case "uint":
        return { kind: TypeRefKind.Number };
      case "Boolean":
        return { kind: TypeRefKind.Boolean };
      case "Array":
        return {
          kind: TypeRefKind.Array,
          elementType: { kind: TypeRefKind.Any },
        };

      case "Error":
      case "Function":
        return { kind: TypeRefKind.Global, name };

      case "Class":
      case "XML":
      case "XMLList":
        return { kind: TypeRefKind.Class, namespace: "_internal.avm2", name };

      default:
        return null;
    }
  }

  resolveVariableKind(name: string): VariableKind {
    let kind: VariableKind | null = null;
    let scope: Scope | null = this;
    while (scope) {
      const type = scope.resolveLocalType(name);
      if (type) {
        kind = VariableKind.Type;
        break;
      }
      if (scope.declaredVariables.includes(name)) {
        kind = VariableKind.Local;
        break;
      }
      if (scope.classDef) {
        const names = new Set([
          ...scope.classDef.methods.map((m) => m.name),
          ...scope.classDef.fields.map((m) => m.name),
        ]);
        if (names.has(name)) {
          return VariableKind.Class;
        }
      }

      scope = scope.parent;
    }
    if (!kind) {
      switch (name) {
        case "trace":
          kind = VariableKind.Intrinsic;
          break;
        default:
          const type = this.resolveRootType(name);
          if (type) {
            kind = VariableKind.Global;
          }
          break;
      }
    }
    if (!kind) {
      // Assume class variables
      return VariableKind.Class;
    }
    return kind;
  }
}
