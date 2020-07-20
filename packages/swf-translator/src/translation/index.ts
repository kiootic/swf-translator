import { SWFFile } from "../format/swf";
import { OutputContext } from "../output/context";
import { generateTemplateFiles } from "./templates";
import { generateCharacters } from "./characters";

export async function translate(ctx: OutputContext, swf: SWFFile) {
  await generateCharacters(ctx, swf);
  generateTemplateFiles(ctx);
}
