import JSON5 from "json5";
import { OutputContext } from "../../output";
import { SWFFile } from "../../format/swf";
import { FilterID as RawFilterID } from "../../format/structs";
import { DefineSpriteTag } from "../../format/tags/define-sprite";
import { FilterID, Filter } from "../../models/filter";
import { color, matrix, colorTransform } from "../../models/primitives";
import { Sprite, SpriteFrame, FrameActionKind } from "../../models/sprite";
import { VariableDeclarationKind } from "ts-morph";
import { PlaceObject2Tag } from "../../format/tags/place-object-2";
import { PlaceObject3Tag } from "../../format/tags/place-object-3";
import { RemoveObject2Tag } from "../../format/tags/remove-object-2";
import { ShowFrameTag } from "../../format/tags/show-frame";

export async function translateSprites(ctx: OutputContext, swf: SWFFile) {
  for (const tag of swf.characters.values()) {
    let sprite: Sprite;
    if (tag instanceof DefineSpriteTag) {
      sprite = translateSprite(tag);
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
          type: "lib._internal.character.Sprite",
          initializer: JSON5.stringify(sprite, null, 4),
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
      `builder.registerSprite(${tag.characterId}, character${tag.characterId})`
    );
  }
}

function translateSprite(sprite: DefineSpriteTag): Sprite {
  let frame: SpriteFrame = { frame: 1, actions: [] };
  const frames: SpriteFrame[] = [frame];

  for (const tag of sprite.controlTags) {
    if (tag instanceof PlaceObject2Tag || tag instanceof PlaceObject3Tag) {
      handlePlaceObject(frame, tag);
    } else if (tag instanceof RemoveObject2Tag) {
      handleRemoveObject(frame, tag);
    } else if (tag instanceof ShowFrameTag) {
      frame = { frame: frames.length + 1, actions: [] };
      frames.push(frame);
    }
  }

  return {
    numFrames: sprite.frameCount,
    frames: frames.filter((f) => f.actions.length > 0),
  };
}

function handlePlaceObject(
  frame: SpriteFrame,
  tag: PlaceObject2Tag | PlaceObject3Tag
) {
  if (tag.placeCharacterId != null) {
    if (tag.moveCharacter) {
      frame.actions.push({
        kind: FrameActionKind.RemoveObject,
        depth: tag.depth,
      });
    }

    frame.actions.push({
      kind: FrameActionKind.PlaceObject,
      characterId: tag.placeCharacterId,
      depth: tag.depth,
    });
  }

  const filters = tag instanceof PlaceObject3Tag ? tag.filters : undefined;
  const blendMode = tag instanceof PlaceObject3Tag ? tag.blendMode : undefined;
  const cacheAsBitmap =
    tag instanceof PlaceObject3Tag ? tag.cacheAsBitmap : undefined;
  const visible = tag instanceof PlaceObject3Tag ? tag.visible : undefined;

  const filterModels: Filter[] = [];
  for (const filter of filters ?? []) {
    switch (filter.id) {
      case RawFilterID.DropShadow:
        filterModels.push({
          id: FilterID.DropShadow,
          color: color(filter.color),
          blurX: filter.blurX,
          blurY: filter.blurY,
          angle: filter.angle,
          distance: filter.distance,
          strength: filter.strength,
          inner: filter.innerShadow,
          knockout: filter.knockout,
          compositeSource: filter.compositeSource,
          passes: filter.passes,
        });
        break;

      case RawFilterID.Blur:
        filterModels.push({
          id: FilterID.Blur,
          blurX: filter.blurX,
          blurY: filter.blurY,
          passes: filter.passes,
        });
        break;

      case RawFilterID.Glow:
        filterModels.push({
          id: FilterID.DropShadow,
          color: color(filter.color),
          blurX: filter.blurX,
          blurY: filter.blurY,
          angle: 0,
          distance: 0,
          strength: filter.strength,
          inner: filter.innerGlow,
          knockout: filter.knockout,
          compositeSource: filter.compositeSource,
          passes: filter.passes,
        });
        break;
    }
  }

  frame.actions.push({
    kind: FrameActionKind.UpdateObject,
    depth: tag.depth,

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
