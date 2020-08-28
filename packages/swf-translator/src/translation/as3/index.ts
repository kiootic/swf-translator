import { File } from "../../as3/parse";
import { AS3Context } from "./context";
import { translateStructure } from "./structure";
import { translateAST } from "./ast";
import { emit } from "./emit";
import { NodeProp } from "lezer";
import { Node } from "../../as3/node";

export async function translateAS3(files: File[], outDir: string) {
  for (const file of files) {
    let hasError = false;
    const checkError = (node: Node) => {
      if (node.type.prop(NodeProp.error)) {
        hasError = true;
        console.warn(`parse error at ${file.path}:${node.start}:${node.end}`);
      }
      for (const child of node.children) {
        checkError(child);
      }
    };
    checkError(file.node);
    if (hasError) {
      console.warn(String(file.node));
    }
  }

  const ctx = new AS3Context();
  translateStructure(ctx, files);
  translateAST(ctx);

  await emit(ctx, outDir);
}
