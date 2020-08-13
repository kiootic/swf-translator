import JSON5 from "json5";
import { VariableDeclarationKind } from "ts-morph";
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

    const char = ctx.file("characters", `${tag.characterId}.ts`);
    char.tsSource.addImportDeclaration({
      defaultImport: "lib",
      moduleSpecifier: "@swf/lib",
    });
    char.tsSource.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `character`,
          type: "lib.__internal.character.ShapeCharacter",
          initializer: JSON5.stringify(shape, null, 4),
        },
      ],
    });
    char.tsSource.addExportAssignment({
      expression: "character",
      isExportEquals: false,
    });

    const index = ctx.file("characters", `index.ts`);
    index.tsSource.addImportDeclaration({
      defaultImport: `character${tag.characterId}`,
      moduleSpecifier: `./${tag.characterId}`,
    });
    index.tsSource.addStatements(
      `bundle.shapes[${tag.characterId}] = character${tag.characterId};`
    );

    shapes[tag.characterId] = shape;
  }
  return shapes;
}
