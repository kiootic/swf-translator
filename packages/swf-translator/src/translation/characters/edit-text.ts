import { SWFFile } from "../../format/swf";
import { OutputContext } from "../../output";
import { EditText } from "../../models/text";
import { DefineEditTextTag } from "../../format/tags/define-edit-text";
import { color, rect } from "../../models/primitives";

export async function translateEditTexts(ctx: OutputContext, swf: SWFFile) {
  const editTexts: Record<number, unknown> = {};
  for (const tag of swf.characters.values()) {
    let text: unknown;
    if (tag instanceof DefineEditTextTag) {
      text = translateEditText(tag);
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
      `bundle.editTexts[${tag.characterId}] = character${tag.characterId} as any;`
    );
    editTexts[tag.characterId] = text;
  }

  return editTexts;
}

function translateEditText(tag: DefineEditTextTag): EditText {
  return {
    bounds: rect(tag.bounds),

    isWordWrap: tag.isWordWrap,
    isMultiline: tag.isMultiline,
    isPassword: tag.isPassword,
    isReadonly: tag.isReadonly,
    isAutoSize: tag.isAutoSize,
    noSelect: tag.noSelect,
    border: tag.border,
    wasStatic: tag.wasStatic,
    isHTML: tag.isHTML,
    useOutlines: tag.useOutlines,

    fontID: tag.fontID,
    fontHeight: tag.fontHeight,
    textColor: tag.textColor ? color(tag.textColor) : undefined,
    maxLength: tag.maxLength,
    align: tag.align,
    leftMargin: tag.leftMargin,
    rightMargin: tag.rightMargin,
    indent: tag.indent,
    leading: tag.leading,
    variableName: tag.variableName !== "" ? tag.variableName : undefined,
    initialText: tag.initialText,
  };
}
