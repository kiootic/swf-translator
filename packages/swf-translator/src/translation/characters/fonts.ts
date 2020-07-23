import JSON5 from "json5";
import { VariableDeclarationKind } from "ts-morph";
import { SWFFile } from "../../format/swf";
import { OutputContext } from "../../output";
import { DefineFont3Tag } from "../../format/tags/define-font-3";
import { Font, FontGlyph } from "../../models/text";
import { translateShape } from "./shape";

export async function translateFonts(ctx: OutputContext, swf: SWFFile) {
  for (const tag of swf.characters.values()) {
    let font: Font;
    if (tag instanceof DefineFont3Tag) {
      font = translateFont(tag);
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
          type: "lib._internal.character.Font",
          initializer: JSON5.stringify(font, null, 4),
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
      `builder.registerFont(${tag.characterId}, character${tag.characterId})`
    );
  }
}

function translateFont(tag: DefineFont3Tag): Font {
  const numGlyphs = tag.glyphShapes.length;

  const glyphs = new Array<FontGlyph>(numGlyphs);
  for (let i = 0; i < numGlyphs; i++) {
    const char = tag.glyphCodes[i]
      ? String.fromCharCode(tag.glyphCodes[i])
      : undefined;
    const shape = translateShape({
      fillStyles: [
        { type: 0, color: { red: 0xff, green: 0xff, blue: 0xff, alpha: 0xff } },
      ],
      lineStyles: [],
      ...tag.glyphShapes[i],
    });
    glyphs[i] = { char, shape };
  }

  const font: Font = { name: tag.fontName, glyphs };
  if (tag.glyphAdvances) {
    font.layout = {
      ascent: tag.ascent ?? 0,
      descent: tag.descent ?? 0,
      leading: tag.leading ?? 0,
      advances: tag.glyphAdvances,
    };
  }

  return font;
}
