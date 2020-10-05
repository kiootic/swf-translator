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

    const index = ctx.file("characters", "index.ts");
    index.tsSource.addImportDeclaration({
      defaultImport: `character${tag.characterId}`,
      moduleSpecifier: index.relPathTo(assetFile),
    });
    index.tsSource.addStatements(
      `bundle.sounds[${tag.characterId}] = { path: character${tag.characterId} };`
    );
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
  file.content = data;
  return file;
}
