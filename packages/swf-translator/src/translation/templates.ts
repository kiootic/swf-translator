import { OutputContext } from "../output";

export function generateTemplateFiles(ctx: OutputContext) {
  const fileContent = (content: string) => Buffer.from(content.trim() + "\n");

  ctx.file("assets.d.ts").content = fileContent(`

declare module "*.jpeg" {
  const path: string;
  export default path;
}

declare module "*.png" {
  const path: string;
  export default path;
}

`);

  ctx.file("library.ts").content = fileContent(`

import lib from "@swf/lib";

export const builder = new lib._internal.AssetLibraryBuilder()

`);

  ctx.file("index.ts").content = fileContent(`

import lib from "@swf/lib";
import "./characters";
import { builder } from "./library";

let assetLibrary: Promise<lib._internal.AssetLibrary> | undefined;

export function library(): Promise<lib._internal.AssetLibrary> {
  return assetLibrary ?? (assetLibrary = builder.instantiate());
}

export { properties } from "./properties";
`);
}
