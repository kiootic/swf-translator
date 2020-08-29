import { SWFFile } from "../../format/swf";
import { DefineShapeTag } from "../../format/tags/define-shape";
import { OutputContext } from "../../output";
import { DefineShape2Tag } from "../../format/tags/define-shape-2";
import { DefineShape3Tag } from "../../format/tags/define-shape-3";
import { DefineShape4Tag } from "../../format/tags/define-shape-4";
import { Shape } from "../../models/shape";
import { translateShape } from "./shape";

export async function translateShapes(ctx: OutputContext, swf: SWFFile) {
  const shapes: Record<number, unknown> = {};
  for (const tag of swf.characters.values()) {
    let shape: Shape;
    if (
      tag instanceof DefineShapeTag ||
      tag instanceof DefineShape2Tag ||
      tag instanceof DefineShape3Tag ||
      tag instanceof DefineShape4Tag
    ) {
      shape = translateShape(tag.shapes);
    } else {
      continue;
    }

    const char = ctx.file("characters", `${tag.characterId}.json`);
    char.content = Buffer.from(JSON.stringify(shape, null, 4));

    const index = ctx.file("characters", `index.ts`);
    index.tsSource.addImportDeclaration({
      defaultImport: `character${tag.characterId}`,
      moduleSpecifier: `./${tag.characterId}.json`,
    });
    index.tsSource.addStatements(
      `bundle.shapes[${tag.characterId}] = character${tag.characterId} as any;`
    );

    shapes[tag.characterId] = shape;
  }
  return shapes;
}
