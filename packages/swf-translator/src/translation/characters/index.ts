import { OutputContext } from "../../output";
import { SWFFile } from "../../format/swf";
import { translateImages } from "./images";
import { translateShapes } from "./shapes";

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
}
