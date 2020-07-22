import { Container } from "pixi.js";
import {
  Sprite as SpriteCharacter,
  SpriteFrame,
  FrameActionKind,
} from "../../classes/_internal/character";
import type { AssetLibrary } from "../../classes/_internal";

export class SpriteInstance {
  readonly frames: SpriteFrame[];

  constructor(sprite: SpriteCharacter, readonly library: AssetLibrary) {
    this.frames = sprite.frames;
  }

  applyTo(sprite: Container, frameNum: number) {
    const frame = this.frames.find((f) => f.frame === frameNum);
    if (!frame) {
      return;
    }

    // ref: https://github.com/mozilla/shumway/blob/16451d8836fa85f4b16eeda8b4bda2fa9e2b22b0/src/flash/display/Sprite.ts#L147
    for (const action of frame.actions) {
      switch (action.kind) {
        case FrameActionKind.PlaceObject: {
          let insertIndex = sprite.children.findIndex(
            (c) => c.__flash && c.__flash.__depth > action.depth
          );
          if (insertIndex === -1) {
            insertIndex = sprite.children.length;
          }

          const character = this.library.instantiateCharacter(
            action.characterId
          );
          character.__depth = action.depth;
          sprite.addChildAt(character.__pixi, insertIndex);
          break;
        }

        case FrameActionKind.RemoveObject: {
          const object = sprite.children.find(
            (o) => o.__flash?.__depth === action.depth
          );
          if (!object) {
            break;
          }

          sprite.removeChild(object);
          break;
        }

        case FrameActionKind.UpdateObject: {
          const dispObj = sprite.children.find(
            (o) => o.__flash?.__depth === action.depth
          )?.__flash;
          if (!dispObj) {
            break;
          }

          if (action.matrix != null) {
            dispObj.transform.matrix.__pixi.fromArray(action.matrix);
          }

          // TODO: colorTransform
          // TODO: ratio

          if (action.name != null) {
            dispObj.__pixi.name = action.name;
          }

          // TODO: filters
          // TODO: blendMode

          if (action.cacheAsBitmap != null) {
            dispObj.__pixi.cacheAsBitmap = action.cacheAsBitmap;
          }

          if (action.visible != null) {
            dispObj.__pixi.visible = action.visible;
          }

          break;
        }
      }
    }
  }
}
