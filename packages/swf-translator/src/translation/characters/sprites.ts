import { OutputContext } from "../../output";
import { SWFFile } from "../../format/swf";
import { DefineSpriteTag } from "../../format/tags/define-sprite";
import { filter } from "../../models/filter";
import { matrix, colorTransform } from "../../models/primitives";
import { Sprite, SpriteFrame, FrameActionKind } from "../../models/sprite";
import { Tag } from "../../format/tag";
import { PlaceObject2Tag } from "../../format/tags/place-object-2";
import { PlaceObject3Tag } from "../../format/tags/place-object-3";
import { RemoveObject2Tag } from "../../format/tags/remove-object-2";
import { ShowFrameTag } from "../../format/tags/show-frame";
import { FrameLabelTag } from "../../format/tags/frame-label";
import { DefineSceneAndFrameLabelDataTag } from "../../format/tags/define-scene-and-frame-label-data";

export async function translateSprites(ctx: OutputContext, swf: SWFFile) {
  const sprites: Record<number, unknown> = {};
  for (const tag of swf.characters.values()) {
    if (tag instanceof DefineSpriteTag) {
      sprites[tag.characterId] = translateSprite(tag);
    }
  }
  sprites[0] = translateDocumentSprite(swf);

  for (const [characterId, sprite] of Object.entries(sprites)) {
    const char = ctx.file("characters", `${characterId}.json`);
    char.content = Buffer.from(JSON.stringify(sprite, null, 4));

    const index = ctx.file("characters", `index.ts`);
    index.tsSource.addImportDeclaration({
      defaultImport: `character${characterId}`,
      moduleSpecifier: `./${characterId}.json`,
    });
    index.tsSource.addStatements(
      `bundle.sprites[${characterId}] = character${characterId} as any;`
    );
  }
  return sprites;
}

function translateSprite(sprite: DefineSpriteTag): Sprite {
  const frames = processTags(sprite.controlTags);

  return { numFrames: sprite.frameCount, frames };
}

function translateDocumentSprite(swf: SWFFile): Sprite {
  const frames = processTags(swf.tags);

  return { numFrames: swf.frameCount, frames };
}

function processTags(tags: Tag[]): SpriteFrame[] {
  let frame: SpriteFrame = { frame: 1, actions: [] };
  const frames: SpriteFrame[] = [frame];

  for (const tag of tags) {
    if (tag instanceof PlaceObject2Tag || tag instanceof PlaceObject3Tag) {
      handlePlaceObject(frame, tag);
    } else if (tag instanceof RemoveObject2Tag) {
      handleRemoveObject(frame, tag);
    } else if (tag instanceof ShowFrameTag) {
      frame = { frame: frames.length + 1, actions: [] };
      frames.push(frame);
    } else if (tag instanceof FrameLabelTag) {
      frame.label = tag.name;
    }
  }

  for (const tag of tags) {
    if (tag instanceof DefineSceneAndFrameLabelDataTag) {
      for (const { frame, label } of tag.frameLabels) {
        const f = frames.find((f) => f.frame === frame + 1);
        if (f) {
          f.label = label;
        }
      }
    }
  }

  return frames.filter((f) => f.actions.length > 0);
}

function handlePlaceObject(
  frame: SpriteFrame,
  tag: PlaceObject2Tag | PlaceObject3Tag
) {
  const filters = tag instanceof PlaceObject3Tag ? tag.filters : undefined;
  const blendMode = tag instanceof PlaceObject3Tag ? tag.blendMode : undefined;
  const cacheAsBitmap =
    tag instanceof PlaceObject3Tag ? tag.cacheAsBitmap : undefined;
  const visible = tag instanceof PlaceObject3Tag ? tag.visible : undefined;

  const filterModels = (filters ?? []).map((f) => filter(f));

  frame.actions.push({
    kind: FrameActionKind.PlaceObject,
    depth: tag.depth,
    characterId: tag.placeCharacterId,

    matrix: tag.matrix && matrix(tag.matrix),
    colorTransform: tag.colorTransform && colorTransform(tag.colorTransform),
    ratio: tag.ratio,
    name: tag.name,
    clipDepth: tag.clipDepth,

    filters: filterModels,
    blendMode,
    cacheAsBitmap,
    visible,
  });
}

function handleRemoveObject(frame: SpriteFrame, tag: RemoveObject2Tag) {
  frame.actions.push({
    kind: FrameActionKind.RemoveObject,
    depth: tag.depth,
  });
}
