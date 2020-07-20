import { SWFFile } from "../format/swf";
import { OutputContext } from "../output/context";
import { translateImages } from "./characters/images";
import { translateShapes } from "./characters/shapes";

export async function translate(ctx: OutputContext, swf: SWFFile) {
  await translateImages(ctx, swf);
  await translateShapes(ctx, swf);
}
