import { File } from "../../as3/parse";
import { AS3Context } from "./context";
import { translateStructure } from "./structure";
import { translateAST } from "./ast";
import { emit } from "./emit";
import { NodeProp } from "lezer";

export async function translateAS3(files: File[], outDir: string) {
  for (const file of files) {
    let hasError = false;
    file.node.tree.iterate({
      enter: (type, start, end) => {
        if (type.prop(NodeProp.error)) {
          hasError = true;
          console.warn(`parse error at ${file.path}:${start}:${end}`);
        }
      },
    });
    if (hasError) {
      console.warn(String(file.node.tree));
    }
  }

  const ctx = new AS3Context();
  translateStructure(ctx, files);
  translateAST(ctx);

  await emit(ctx, outDir);
}
