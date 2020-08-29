import { SWFFile } from "../../format/swf";
import { OutputContext } from "../../output";
import { StaticText, TextGlyph } from "../../models/text";
import { DefineTextTag } from "../../format/tags/define-text";
import { DefineText2Tag } from "../../format/tags/define-text-2";
import { color, matrix, rect } from "../../models/primitives";

export async function translateStaticTexts(ctx: OutputContext, swf: SWFFile) {
  const staticTexts: Record<number, unknown> = {};
  for (const tag of swf.characters.values()) {
    let text: unknown;
    if (tag instanceof DefineTextTag || tag instanceof DefineText2Tag) {
      text = translateStaticText(tag);
    } else {
      continue;
    }

    const char = ctx.file("characters", `${tag.characterId}.json`);
    char.content = Buffer.from(JSON.stringify(text, null, 4));

    const index = ctx.file("characters", `index.ts`);
    index.tsSource.addImportDeclaration({
      defaultImport: `character${tag.characterId}`,
      moduleSpecifier: `./${tag.characterId}.json`,
    });
    index.tsSource.addStatements(
      `bundle.staticTexts[${tag.characterId}] = character${tag.characterId} as any;`
    );
    staticTexts[tag.characterId] = text;
  }

  return staticTexts;
}

function translateStaticText(tag: DefineTextTag | DefineText2Tag): StaticText {
  let fontId = 0;
  let textColor = 0;
  let xOffset = 0;
  let yOffset = 0;
  let textHeight = 0;
  const glyphs: TextGlyph[] = [];

  for (const record of tag.textRecords) {
    if (record.fontId != null) {
      fontId = record.fontId;
    }
    if (record.textColor != null) {
      textColor = color(record.textColor);
    }
    if (record.textHeight != null) {
      textHeight = record.textHeight;
    }
    xOffset = record.xOffset ?? 0;
    yOffset = record.yOffset ?? 0;

    for (const { index, advance } of record.glyphs) {
      glyphs.push({
        fontId,
        color: textColor,
        x: xOffset,
        y: yOffset,
        size: textHeight,
        index,
      });
      xOffset += advance;
    }
  }

  return {
    matrix: matrix(tag.textMatrix),
    glyphs,
    bounds: rect(tag.textBounds),
  };
}
