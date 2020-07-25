import { Sprite } from "../../classes/flash/display/Sprite";
import {
  SpriteCharacter,
  SpriteFrame,
  FrameActionKind,
} from "../../classes/_internal/character";
import type { AssetLibrary } from "../../classes/_internal";
import { CharacterInstance } from "./CharacterInstance";
import { mat2d } from "gl-matrix";

export class SpriteInstance implements CharacterInstance {
  readonly numFrames: number;
  readonly frames: SpriteFrame[];

  constructor(
    readonly id: number,
    sprite: SpriteCharacter,
    readonly library: AssetLibrary
  ) {
    this.numFrames = sprite.numFrames;
    this.frames = sprite.frames;
  }

  applyTo(sprite: Sprite, frameNum: number) {
    const frame = this.frames.find((f) => f.frame === frameNum);
    if (!frame) {
      return;
    }

    // ref: https://github.com/mozilla/shumway/blob/16451d8836fa85f4b16eeda8b4bda2fa9e2b22b0/src/flash/display/Sprite.ts#L147
    for (const action of frame.actions) {
      switch (action.kind) {
        case FrameActionKind.PlaceObject: {
          let insertIndex = sprite.__children.findIndex(
            (o) => o.__depth >= action.depth
          );
          if (insertIndex === -1) {
            insertIndex = sprite.__children.length;
          } else if (sprite.__children[insertIndex].__depth === action.depth) {
            const char = sprite.__children[insertIndex].__character;
            if (char?.id === action.characterId) {
              break;
            }
            sprite.removeChildAt(insertIndex);
          }

          const character = this.library.instantiateCharacter(
            action.characterId
          );
          character.__depth = action.depth;
          sprite.addChildAt(character, insertIndex);
          break;
        }

        case FrameActionKind.RemoveObject: {
          const index = sprite.__children.findIndex(
            (o) => o.__depth === action.depth
          );
          if (index < 0) {
            break;
          }

          sprite.removeChildAt(index);
          break;
        }

        case FrameActionKind.UpdateObject: {
          const obj = sprite.__children.find((o) => o.__depth === action.depth);
          if (!obj) {
            break;
          }

          if (action.matrix != null) {
            mat2d.copy(obj.transform.matrix.__value, action.matrix);
            obj.transform.__reportMatrixUpdated();
          }

          // TODO: colorTransform
          // TODO: ratio

          if (action.name != null) {
            obj.name = action.name;
          }

          // TODO: filters
          // TODO: blendMode

          // TODO: cacheAsBitmap

          if (action.visible != null) {
            obj.visible = action.visible;
          }

          break;
        }
      }
    }
  }
}
