import { OutputContext } from "../../output";
import { SWFFile } from "../../format/swf";
import { translateImages } from "./images";
import { translateSounds } from "./sounds";
import { translateShapes } from "./shapes";
import { translateSprites } from "./sprites";
import { translateFonts } from "./fonts";
import { translateStaticTexts } from "./static-texts";
import { translateEditTexts } from "./edit-text";
import { translateMorphShapes } from "./morph-shape";
import { translateButtons } from "./buttons";
import { translateLinkages } from "./linkage";

export async function generateCharacters(ctx: OutputContext, swf: SWFFile) {
  const charIndex = ctx.file("characters", "index.js");
  charIndex.content.push(`export const bundle = {
      images: {},
      sounds: {},
      shapes: {},
      morphShapes: {},
      fonts: {},
      staticTexts: {},
      editTexts: {},
      sprites: {},
      buttons: {},
      linkages: {},
    };
  `);

  const assetIndex = ctx.file("assets", "index.js");
  assetIndex.content.push(`export const assets = {};`);

  await translateImages(ctx, swf);
  await translateSounds(ctx, swf);
  await translateShapes(ctx, swf);
  await translateMorphShapes(ctx, swf);
  await translateSprites(ctx, swf);
  await translateFonts(ctx, swf);
  await translateStaticTexts(ctx, swf);
  await translateEditTexts(ctx, swf);
  await translateButtons(ctx, swf);
  await translateLinkages(ctx, swf);
}
