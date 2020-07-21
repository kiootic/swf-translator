import { SWFFile } from "../format/swf";
import { OutputContext } from "../output/context";
import { generateTemplateFiles } from "./templates";
import { generateCharacters } from "./characters";
import { generateProperties } from "./properties";

export async function translate(ctx: OutputContext, swf: SWFFile) {
  await generateCharacters(ctx, swf);
  generateProperties(ctx, swf);
  generateTemplateFiles(ctx);
}
