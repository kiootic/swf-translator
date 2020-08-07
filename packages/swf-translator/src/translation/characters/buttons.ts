import JSON5 from "json5";
import { VariableDeclarationKind } from "ts-morph";
import { SWFFile } from "../../format/swf";
import { OutputContext } from "../../output";
import { matrix, colorTransform } from "../../models/primitives";
import { DefineButton2Tag } from "../../format/tags/define-button-2";
import { Button } from "../../models/button";
import { filter } from "../../models/filter";

export async function translateButtons(ctx: OutputContext, swf: SWFFile) {
  const buttons: Record<number, unknown> = {};
  for (const tag of swf.characters.values()) {
    let button: unknown;
    if (tag instanceof DefineButton2Tag) {
      button = translateButton(tag);
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
          type: `lib._internal.character.ButtonCharacter`,
          initializer: JSON5.stringify(button, null, 4),
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
      `bundle.buttons[${tag.characterId}] = character${tag.characterId};`
    );
    buttons[tag.characterId] = button;
  }

  return buttons;
}

function translateButton(tag: DefineButton2Tag): Button {
  const button: Button = {
    trackAsMenu: tag.trackAsMenu,
    characters: [],
  };

  for (const record of tag.records) {
    button.characters.push({
      hitTest: record.hitTest,
      down: record.down,
      over: record.over,
      up: record.up,
      characterId: record.characterId,
      depth: record.depth,
      matrix: matrix(record.matrix),
      colorTransform: colorTransform(record.colorTransform),
      filters: record.filters?.map((f) => filter(f)),
      blendMode: record.blendMode,
    });
  }

  return button;
}
