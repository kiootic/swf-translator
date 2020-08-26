import { AS3Context } from "../context";
import { emitClass } from "./structure";
import mkdirp from "mkdirp";
import { promisify } from "util";
import rimraf from "rimraf";
import { join, dirname } from "path";
import { promises } from "fs";

export async function emit(ctx: AS3Context, outDir: string) {
  const files = new Map<string, string>();
  const namespaceClasses = new Map<string, string[]>();
  for (const cls of ctx.classes.values()) {
    const path = `${cls.namespace}.${cls.name}`.replace(/\./g, "/") + ".ts";
    files.set(path, emitClass(cls));

    namespaceClasses.set(cls.namespace, [
      ...(namespaceClasses.get(cls.namespace) ?? []),
      cls.name,
    ]);
  }

  for (const [namespace, classes] of namespaceClasses) {
    const exports = classes.map((name) => `export {${name}} from "./${name}";`);
    files.set(namespace.replace(/\./g, "/") + "/index.ts", exports.join("\n"));
  }

  const processedNamespaces = new Set<string>();
  for (const namespace of namespaceClasses.keys()) {
    if (namespace === "") {
      continue;
    }
    const parts = namespace.split(".");
    for (let i = 0; i < parts.length; i++) {
      if (processedNamespaces.has(parts.slice(0, i + 1).join("."))) {
        continue;
      }
      processedNamespaces.add(parts.slice(0, i + 1).join("."));

      const part = parts[i];
      const parentPath = parts.slice(0, i).join("/") + "/index.ts";
      let parentText = files.get(parentPath) ?? "";
      parentText += `import * as ${part} from "./${part}";\nexport {${part}};\n`;
      files.set(parentPath, parentText);
    }
  }

  await flush(outDir, files);
}

async function flush(directory: string, files: Map<string, string>) {
  await mkdirp(directory);
  await promisify(rimraf)(directory + "/classes");

  for (const [relPath, file] of files) {
    const path = join(directory, "classes", relPath);
    mkdirp.sync(dirname(path));

    await promises.writeFile(path, file);
  }
}
