import { AS3Context } from "../context";
import { TypeRef, TypeRefClass, TypeRefKind } from "./type-ref";
import type { ClassDef, MethodDef } from "./structure";

export class Scope {
  packageName?: string;
  classDef?: ClassDef;
  methodDef?: MethodDef;
  readonly importedPackages: string[] = [];
  readonly importedTypes: TypeRefClass[] = [];

  constructor(readonly context: AS3Context, readonly parent: Scope | null) {}

  child(): Scope {
    const scope = new Scope(this.context, this);
    scope.packageName = this.packageName;
    scope.classDef = this.classDef;
    scope.methodDef = this.methodDef;
    return scope;
  }

  resolveType(name: string): TypeRef {
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

    return this.parent
      ? this.parent.resolveType(name)
      : this.resolveRootType(name);
  }

  private resolveRootType(name: string): TypeRef {
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
        return { kind: TypeRefKind.Class, namespace: "_internal.avm2", name };

      default:
        throw new Error(`Cannot resolve type: ${name}`);
    }
  }
}
