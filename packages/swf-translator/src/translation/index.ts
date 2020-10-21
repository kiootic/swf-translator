import { SWFFile } from "../format/swf";
import { OutputContext } from "../output/context";
import { generateCharacters } from "./characters";
import { generateProperties } from "./properties";

export async function translateSWF(ctx: OutputContext, swf: SWFFile) {
  await generateCharacters(ctx, swf);
  generateProperties(ctx, swf);
}
