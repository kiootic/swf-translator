import { SWFFile } from "../format/swf";
import { OutputContext } from "../output/context";
import { generateTemplateFiles } from "./templates";
import { generateCharacters } from "./characters";
import { generateProperties } from "./swf/properties";

export async function translateSWF(ctx: OutputContext, swf: SWFFile) {
  await generateCharacters(ctx, swf);
  generateProperties(ctx, swf);
  generateTemplateFiles(ctx);
}
