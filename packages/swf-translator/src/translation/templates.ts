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

export const library = new lib._internal.Library()

`);

  ctx.file("index.ts").content = fileContent(`

import "./characters";
export { library } from "./library";

`);
}
