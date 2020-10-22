import { SWFFile } from "../../format/swf";
import { OutputContext } from "../../output/context";
import { DefineSoundTag } from "../../format/tags/define-sound";
import { File } from "../../output";

export async function translateSounds(ctx: OutputContext, swf: SWFFile) {
  for (const tag of swf.characters.values()) {
    let assetFile: File;
    if (tag instanceof DefineSoundTag) {
      assetFile = await translateSound(ctx, tag);
    } else {
      continue;
    }

    const charIndex = ctx.file("characters", "index.js");
    charIndex.content.push(`
      bundle.sounds[${tag.characterId}] = { id: "character${tag.characterId}" };
    `);

    const assetIndex = ctx.file("assets", "index.js");
    assetIndex.content.push(`
      assets["character${tag.characterId}"] = {
        url: new URL("${assetIndex.relPathTo(assetFile)}", import.meta.url),
        size: ${assetFile.content[0].length},
      };
    `);
  }
}

async function translateSound(ctx: OutputContext, tag: DefineSoundTag) {
  let format: string;
  let data: Buffer;
  switch (tag.soundFormat) {
    case 2:
      format = "mp3";
      data = tag.soundData.slice(2);
      break;
    default:
      throw new Error(`Unsupported audio format: ${tag.soundFormat}`);
  }

  const file = ctx.file("assets", `${tag.characterId}.${format}`);
  file.content.push(data);
  return file;
}
