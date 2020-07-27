import { Sprite } from "../../classes/flash/display/Sprite";
import {
  SpriteCharacter,
  SpriteFrame,
  FrameActionKind,
  FrameAction,
} from "../../classes/_internal/character";
import type { AssetLibrary } from "../../classes/_internal";
import { CharacterInstance } from "./CharacterInstance";
import { mat2d, vec4 } from "gl-matrix";
import { DisplayObject } from "../../classes/flash/display";

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

  applyTo(sprite: Sprite, prevFrameNum: number, thisFrameNum: number) {
    // ref: https://github.com/mozilla/shumway/blob/16451d8836fa85f4b16eeda8b4bda2fa9e2b22b0/src/flash/display/Sprite.ts#L147
    const effectiveActions = new Map<number, FrameAction>();
    const setActions = (frameNum: number) => {
      if (frameNum === 1) {
        // Reset timeline on frame 1
        for (const child of sprite.__children) {
          if (child.__depth >= 0) {
            effectiveActions.set(child.__depth, {
              kind: FrameActionKind.RemoveObject,
              depth: child.__depth,
            });
          }
        }
      }

      const frame = this.frames.find((f) => f.frame === frameNum);
      if (!frame) {
        return;
      }
      for (const action of frame.actions) {
        const ea = effectiveActions.get(action.depth) || {};
        effectiveActions.set(action.depth, { ...ea, ...action });
      }
    };
    for (
      let i = prevFrameNum - 1;
      i !== thisFrameNum - 1;
      i = (i + 1) % this.numFrames
    ) {
      setActions(i + 1);
    }
    setActions(thisFrameNum);

    const children = sprite.__children;
    for (const action of effectiveActions.values()) {
      switch (action.kind) {
        case FrameActionKind.PlaceObject: {
          let character: DisplayObject | undefined;
          if (action.characterId) {
            let index = children.findIndex((o) => o.__depth >= action.depth);
            if (index === -1) {
              index = children.length;
            } else if (children[index].__depth === action.depth) {
              const char = children[index].__character;
              if (char?.id === action.characterId) {
                character = children[index];
              } else {
                sprite.removeChildAt(index);
              }
            }

            if (!character) {
              character = this.library.instantiateCharacter(action.characterId);
              character.__depth = action.depth;
              sprite.addChildAt(character, index);
            }
          } else {
            character = children.find((o) => o.__depth === action.depth);
          }

          if (!character) {
            break;
          }

          if (action.matrix != null) {
            mat2d.copy(character.transform.matrix.__value, action.matrix);
            character.transform.__reportMatrixUpdated();
          }

          if (action.colorTransform != null) {
            vec4.copy(
              character.transform.colorTransform.__mul,
              action.colorTransform.slice(0, 4) as vec4
            );
            vec4.copy(
              character.transform.colorTransform.__add,
              action.colorTransform.slice(4, 8) as vec4
            );
            character.transform.__reportColorTransformUpdated();
          }
          // TODO: ratio

          if (action.name != null) {
            character.name = action.name;
          }

          // TODO: filters
          // TODO: blendMode

          // TODO: cacheAsBitmap

          if (action.visible != null) {
            character.visible = action.visible;
          }

          break;
        }

        case FrameActionKind.RemoveObject: {
          const index = children.findIndex((o) => o.__depth === action.depth);
          if (index < 0) {
            break;
          }

          sprite.removeChildAt(index);
          break;
        }
      }
    }
  }
}