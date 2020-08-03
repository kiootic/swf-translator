import { mat2d, vec4 } from "gl-matrix";
import { Sprite } from "../../classes/flash/display/Sprite";
import { MorphShape } from "../../classes/flash/display/MorphShape";
import { DisplayObject } from "../../classes/flash/display/DisplayObject";
import { BitmapFilter } from "../../classes/flash/filters/BitmapFilter";
import {
  SpriteCharacter,
  SpriteFrame,
  FrameActionKind,
  FrameAction,
} from "../../classes/_internal/character/Sprite";
import { FilterID } from "../../classes/_internal/character/filter";
import type { AssetLibrary } from "../../classes/_internal";
import { DropShadowFilter } from "../../classes/flash/filters/DropShadowFilter";
import { BlurFilter } from "../../classes/flash/filters/BlurFilter";
import { CharacterInstance } from "./CharacterInstance";

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
        const ea = effectiveActions.get(action.depth);
        if (!ea || ea.kind !== action.kind) {
          effectiveActions.set(action.depth, action);
        } else {
          effectiveActions.set(action.depth, { ...(ea || {}), ...action });
        }
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

          if (action.clipDepth != null) {
            character.__clipDepth = action.clipDepth;
          }

          if (action.matrix != null) {
            mat2d.copy(character.transform.matrix.__value, action.matrix);
            character.transform.matrix.__value[4] /= 20;
            character.transform.matrix.__value[5] /= 20;
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

          if (action.name != null) {
            character.name = action.name;
          }

          if (action.filters != null) {
            const filters: BitmapFilter[] = [];
            for (const f of action.filters) {
              switch (f.id) {
                case FilterID.Blur: {
                  const filter = new BlurFilter();
                  filter.blurX = f.blurX;
                  filter.blurY = f.blurY;
                  filter.quality = f.passes;

                  filters.push(filter);
                  break;
                }
                case FilterID.DropShadow: {
                  const filter = new DropShadowFilter();
                  filter.color = f.color;
                  filter.blurX = f.blurX;
                  filter.blurY = f.blurY;
                  filter.angle = (f.angle * 180) / Math.PI;
                  filter.distance = f.distance;
                  filter.strength = f.strength;
                  filter.inner = f.inner;
                  filter.knockout = f.knockout;
                  filter.quality = f.passes;

                  filters.push(filter);
                  break;
                }
              }
            }
            character.filters = filters;
          }
          if (action.cacheAsBitmap != null) {
            character.cacheAsBitmap = action.cacheAsBitmap;
          }

          if (action.visible != null) {
            character.visible = action.visible;
          }

          if (action.ratio != null) {
            if (character instanceof MorphShape) {
              character.__ratio = action.ratio;
              character.__character?.applyTo(character);
            }
          }
          // TODO: blendMode

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
