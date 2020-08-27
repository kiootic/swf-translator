import { File } from "../../as3/parse";
import { AS3Context } from "./context";
import { translateStructure } from "./structure";
import { translateAST } from "./ast";
import { emit } from "./emit";

export async function translateAS3(files: File[], outDir: string) {
  const ctx = new AS3Context();
  translateStructure(ctx, files);
  translateAST(ctx);

  await emit(ctx, outDir);
}
