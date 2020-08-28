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

  const bundle = ctx.file("bundle.ts");
  bundle.tsSource.addImportDeclaration({
    defaultImport: "lib",
    moduleSpecifier: "@swf/lib",
  });
  bundle.tsSource.addImportDeclaration({
    defaultImport: "charactersBundle",
    moduleSpecifier: "./characters.bundle.json",
  });
  bundle.tsSource.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: "bundle",
        type: "lib.__internal.AssetBundle",
        initializer: "charactersBundle as any",
      },
    ],
  });

  await translateImages(ctx, swf);
  const shapes = await translateShapes(ctx, swf);
  const morphShapes = await translateMorphShapes(ctx, swf);
  const sprites = await translateSprites(ctx, swf);
  const fonts = await translateFonts(ctx, swf);
  const staticTexts = await translateStaticTexts(ctx, swf);
  const editTexts = await translateEditTexts(ctx, swf);
  const buttons = await translateButtons(ctx, swf);
  const linkages = await translateLinkages(ctx, swf);

  index.tsSource.addExportAssignment({
    expression: "bundle",
    isExportEquals: false,
  });
  bundle.tsSource.addExportAssignment({
    expression: "bundle",
    isExportEquals: false,
  });

  const bundleData = {
    images: {},
    shapes,
    morphShapes,
    fonts,
    staticTexts,
    editTexts,
    sprites,
    buttons,
    linkages,
  };
  const bundleDataJSON = ctx.file("characters.bundle.json");
  bundleDataJSON.content = Buffer.from(JSON.stringify(bundleData));
}
