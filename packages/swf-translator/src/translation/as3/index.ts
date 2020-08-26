import { File } from "../../as3/parse";
import { AS3Context } from "./context";
import { translateStructure } from "./structure";

export function translateAS3(files: File[]) {
  const ctx = new AS3Context();
  translateStructure(ctx, files);

  console.log(ctx);
}
