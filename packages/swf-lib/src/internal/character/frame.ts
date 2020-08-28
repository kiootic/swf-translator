import { mat2d, vec4 } from "gl-matrix";
import { DisplayObject } from "../../classes/flash/display/DisplayObject";
import { DisplayObjectContainer } from "../../classes/flash/display/DisplayObjectContainer";
import { MorphShape } from "../../classes/flash/display/MorphShape";
import { BitmapFilter } from "../../classes/flash/filters/BitmapFilter";
import { BlurFilter } from "../../classes/flash/filters/BlurFilter";
import { DropShadowFilter } from "../../classes/flash/filters/DropShadowFilter";
import {
  FrameAction,
  FrameActionKind,
} from "../../classes/__internal/character/Sprite";
import { FilterID } from "../../classes/__internal/character/filter";
import { AssetLibrary } from "../../classes/__internal/AssetLibrary";

export function executeFrameAction(
  library: AssetLibrary,
  container: DisplayObjectContainer,
  frame: number,
  action: FrameAction
) {
  const children = container.__children;
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
            container.removeChildAt(index);
          }
        }

        if (!character) {
          character = library.instantiateCharacter(action.characterId);
          character.__depth = action.depth;
          container.addChildAt(character, index);
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
      } else if (frame === 1) {
        mat2d.identity(character.transform.matrix.__value);
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
      } else if (frame === 1) {
        vec4.set(character.transform.colorTransform.__mul, 1, 1, 1, 1);
        vec4.set(character.transform.colorTransform.__add, 0, 0, 0, 0);
        character.transform.__reportColorTransformUpdated();
      }

      if (action.name != null) {
        character.name = action.name;
        (container as any)[character.name] = character;
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
      } else if (frame === 1) {
        character.filters = [];
      }

      if (action.cacheAsBitmap != null) {
        character.cacheAsBitmap = action.cacheAsBitmap;
      } else if (frame === 1) {
        character.cacheAsBitmap = false;
      }

      if (action.visible != null) {
        character.visible = action.visible;
      } else if (frame === 1) {
        character.visible = true;
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

      container.removeChildAt(index);
      break;
    }
  }
}
