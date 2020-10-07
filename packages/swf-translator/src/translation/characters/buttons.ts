import { SWFFile } from "../../format/swf";
import { OutputContext } from "../../output";
import { matrix, colorTransform } from "../../models/primitives";
import { Tag } from "../../format/tag";
import { DefineButton2Tag } from "../../format/tags/define-button-2";
import { Button } from "../../models/button";
import { filter } from "../../models/filter";
import { DefineButtonSoundTag } from "../../format/tags/define-button-sound";

export async function translateButtons(ctx: OutputContext, swf: SWFFile) {
  const buttons: Record<number, unknown> = {};
  for (const tag of swf.characters.values()) {
    let button: unknown;
    if (tag instanceof DefineButton2Tag) {
      button = translateButton(tag, swf.tags);
    } else {
      continue;
    }

    const char = ctx.file("characters", `${tag.characterId}.json`);
    char.content = Buffer.from(JSON.stringify(button, null, 4));

    const index = ctx.file("characters", `index.ts`);
    index.tsSource.addImportDeclaration({
      defaultImport: `character${tag.characterId}`,
      moduleSpecifier: `./${tag.characterId}.json`,
    });
    index.tsSource.addStatements(
      `bundle.buttons[${tag.characterId}] = character${tag.characterId} as any;`
    );
    buttons[tag.characterId] = button;
  }

  return buttons;
}

function translateButton(tag: DefineButton2Tag, tags: Tag[]): Button {
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

  const soundTag = tags.find((t): t is DefineButtonSoundTag => t instanceof DefineButtonSoundTag && t.buttonId === tag.characterId);
  if (soundTag) {
    button.overUpToIdle = soundTag.overUpToIdle;
    button.idleToOverUp = soundTag.idleToOverUp;
    button.overUpToOverDown = soundTag.overUpToOverDown;
    button.overDownToOverUp = soundTag.overDownToOverUp;
  }

  return button;
}
