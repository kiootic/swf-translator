import { format } from "prettier";
import { TypeRefClass, TypeRef, TypeRefKind } from "../code/type-ref";
import { ClassDef } from "../code/structure";
import { relative, join } from "path";

export class EmitContext {
  importLib = false;
  readonly imports: TypeRefClass[] = [];
  content = "";

  constructor(readonly classDef: ClassDef) {}

  importType(typeRef: TypeRef): string {
    switch (typeRef.kind) {
      case TypeRefKind.Any:
        return "any";
      case TypeRefKind.Void:
        return "void";
      case TypeRefKind.Object:
        return "object";
      case TypeRefKind.String:
        return "string";
      case TypeRefKind.Number:
        return "number";
      case TypeRefKind.Boolean:
        return "boolean";

      case TypeRefKind.Global:
        return typeRef.name;
      case TypeRefKind.Class:
        if (/^(flash|_internal)/.test(typeRef.namespace)) {
          this.importLib = true;
          return `lib.${typeRef.namespace}.${typeRef.name}`;
        } else {
          this.imports.push(typeRef);
          return typeRef.name;
        }
      case TypeRefKind.Array:
        return `(${this.importType(typeRef.elementType)})[]`;
    }
  }

  emitLine(line: string = "") {
    this.content += line + "\n";
  }

  emit(text: string) {
    this.content += text;
  }

  toString() {
    let text = "";

    if (this.importLib) {
      text += `import lib from "@swf/lib";\n`;
    }

    const imports = new Set<string>();
    for (const importType of this.imports.values()) {
      imports.add(`${importType.namespace}::${importType.name}`);
    }

    for (const importType of imports) {
      const [namespace, name] = importType.split("::");
      if (namespace === this.classDef.namespace && name == this.classDef.name) {
        continue;
      }

      const relNamespacePath = relative(
        this.classDef.namespace.replace(/\./g, "/"),
        namespace.replace(/\./g, "/")
      );
      let importPath = join(relNamespacePath, name);
      if (!importPath.startsWith("../")) {
        importPath = "./" + importPath;
      }
      text += `import { ${name} } from "${importPath}"; \n`;
    }

    text += "\n\n" + this.content;

    text = format(text, { parser: "typescript" });
    return text;
  }
}
