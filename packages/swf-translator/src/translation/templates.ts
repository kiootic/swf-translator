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

declare module "*.mp3" {
  const path: string;
  export default path;
}

`);

  ctx.file("index.ts").content = fileContent(`

import lib from "swf-lib";
import bundle from "./characters";

import * as classes from "./classes";
export * from "./classes";

lib.__internal.ClassRegistry.instance.addClassRoot(classes);

const builder = new lib.__internal.AssetLibraryBuilder();
builder.registerBundle(bundle);

let assetLibrary: Promise<lib.__internal.AssetLibrary> | undefined;
export function __library(): Promise<lib.__internal.AssetLibrary> {
  return assetLibrary ?? (assetLibrary = builder.instantiate());
}

export { properties as __properties } from "./properties";
`);
}
