import JSON5 from "json5";
import { VariableDeclarationKind } from "ts-morph";
import { SWFFile } from "../../format/swf";
import { OutputContext } from "../../output";
import { EditText } from "../../models/text";
import { DefineEditTextTag } from "../../format/tags/define-edit-text";
import { color, matrix, rect } from "../../models/primitives";

export async function translateEditTexts(ctx: OutputContext, swf: SWFFile) {
  const editTexts: Record<number, unknown> = {};
  for (const tag of swf.characters.values()) {
    let text: unknown;
    if (tag instanceof DefineEditTextTag) {
      text = translateEditText(tag);
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
          type: `lib.__internal.character.EditTextCharacter`,
          initializer: JSON5.stringify(text, null, 4),
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
      `bundle.editTexts[${tag.characterId}] = character${tag.characterId};`
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
