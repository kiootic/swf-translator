import { AS3Context } from "../context";
import { TypeRef, TypeRefClass, TypeRefKind } from "./type-ref";
import type { ClassDef } from "./structure";

export class Scope {
  packageName?: string;
  classDef?: ClassDef;
  readonly importedPackages: string[] = [];
  readonly importedTypes: TypeRefClass[] = [];

  constructor(readonly context: AS3Context, readonly parent: Scope | null) {}

  child(): Scope {
    const scope = new Scope(this.context, this);
    scope.packageName = this.packageName;
    scope.classDef = this.classDef;
    return scope;
  }

  resolveType(name: string): TypeRef | null {
    const importedType = this.importedTypes.find((t) => t.name === name);
    if (importedType) {
      return importedType;
    }

    const packages = this.importedPackages.slice();
    if (this.packageName != null) {
      packages.push(this.packageName);
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

    return this.parent && this.parent.resolveType(name);
  }
}
