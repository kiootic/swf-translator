import JSON5 from "json5";
import { OutputContext } from "../../output";
import { SWFFile } from "../../format/swf";
import { translateImages } from "./images";
import { translateShapes } from "./shapes";
import { translateSprites } from "./sprites";
import { translateFonts } from "./fonts";
import { translateStaticTexts } from "./static-texts";
import { VariableDeclarationKind } from "ts-morph";
import { translateEditTexts } from "./edit-text";
import { translateMorphShapes } from "./morph-shape";
import { translateButtons } from "./buttons";
import { translateLinkages } from "./linkage";

export async function generateCharacters(ctx: OutputContext, swf: SWFFile) {
  const index = ctx.file("characters", "index.ts");
  index.tsSource.addImportDeclaration({
    defaultImport: "lib",
    moduleSpecifier: "@swf/lib",
  });
  index.tsSource.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: "bundle",
        type: "lib.__internal.AssetBundle",
        initializer: JSON5.stringify(
          {
            images: {},
            shapes: {},
            morphShapes: {},
            fonts: {},
            staticTexts: {},
            editTexts: {},
            sprites: {},
            buttons: {},
            linkages: {},
          },
          null,
          4
        ),
      },
    ],
  });

  await translateImages(ctx, swf);
  await translateShapes(ctx, swf);
  await translateMorphShapes(ctx, swf);
  await translateSprites(ctx, swf);
  await translateFonts(ctx, swf);
  await translateStaticTexts(ctx, swf);
  await translateEditTexts(ctx, swf);
  await translateButtons(ctx, swf);
  await translateLinkages(ctx, swf);

  index.tsSource.addExportAssignment({
    expression: "bundle",
    isExportEquals: false,
  });
}
