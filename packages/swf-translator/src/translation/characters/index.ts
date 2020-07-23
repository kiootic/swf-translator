import { OutputContext } from "../../output";
import { SWFFile } from "../../format/swf";
import { translateImages } from "./images";
import { translateShapes } from "./shapes";
import { translateSprites } from "./sprites";
import { translateFonts } from "./fonts";
import { translateTexts } from "./texts";

export async function generateCharacters(ctx: OutputContext, swf: SWFFile) {
  const index = ctx.file("characters", "index.ts");
  index.tsSource.addImportDeclaration({
    defaultImport: "lib",
    moduleSpecifier: "@swf/lib",
  });
  index.tsSource.addImportDeclaration({
    namedImports: ["builder"],
    moduleSpecifier: "../library",
  });

  await translateImages(ctx, swf);
  await translateShapes(ctx, swf);
  await translateSprites(ctx, swf);
  await translateFonts(ctx, swf);
  await translateTexts(ctx, swf);
}
