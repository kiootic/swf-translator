import { mat2d, vec4 } from "gl-matrix";
import { DisplayObject } from "../../classes/flash/display/DisplayObject";
import { DisplayObjectContainer } from "../../classes/flash/display/DisplayObjectContainer";
import { MorphShape } from "../../classes/flash/display/MorphShape";
import { MovieClip } from "../../classes/flash/display";
import { BitmapFilter } from "../../classes/flash/filters/BitmapFilter";
import { BlurFilter } from "../../classes/flash/filters/BlurFilter";
import { DropShadowFilter } from "../../classes/flash/filters/DropShadowFilter";
import {
  FrameAction,
  FrameActionKind,
  FrameActionPlaceObject,
} from "../../classes/__internal/character/Sprite";
import { FilterID } from "../../classes/__internal/character/filter";
import { AssetLibrary } from "../../classes/__internal/AssetLibrary";

// ref: https://github.com/mozilla/shumway/blob/16451d8836fa85f4b16eeda8b4bda2fa9e2b22b0/src/flash/display/DisplayObject.ts#L1137

export function executeFrameAction(
  library: AssetLibrary,
  container: DisplayObjectContainer,
  action: FrameAction
) {
  const children = container.__children;
  switch (action.kind) {
    case FrameActionKind.PlaceObject: {
      let character: DisplayObject | undefined;
      if (action.characterId) {
        let index = children.findIndex((o) => o.__depth >= action.depth);
        let oldCharacter: DisplayObject | null = null;
        if (index === -1) {
          index = children.length;
        } else if (children[index].__depth === action.depth) {
          const char = children[index].__character;
          if (char?.id === action.characterId) {
            character = children[index];
          } else {
            oldCharacter = children[index];
            container.removeChildAt(index);
          }
        }

        if (character) {
          setupCharacter(container, character, action, !action.moveCharacter);
        } else {
          const { characterId, depth } = action;
          DisplayObject.__initChar(
            () => library.instantiateCharacter(characterId),
            (char) => {
              container.addChildAt(char, index);
              char.__depth = depth;
              if (oldCharacter) {
                // When same depth is re-used for new character,
                // it seems attributes of old character would carry over to new character.
                copyCharacter(oldCharacter, char);
              }
              setupCharacter(container, char, action, !action.moveCharacter);
            }
          );
        }
      } else {
        character = children.find((o) => o.__depth === action.depth);
        if (character) {
          setupCharacter(container, character, action, false);
        }
      }
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

function copyCharacter(from: DisplayObject, to: DisplayObject) {
  mat2d.copy(to.__node.transformLocal, from.__node.transformLocal);
  vec4.copy(
    to.__node.colorTransformLocalMul,
    from.__node.colorTransformLocalMul
  );
  vec4.copy(
    to.__node.colorTransformLocalAdd,
    from.__node.colorTransformLocalMul
  );
  to.__clipDepth = from.__clipDepth;
  to.name = from.name;
  to.filters = from.filters;
  to.cacheAsBitmap = from.cacheAsBitmap;
  to.visible = from.visible;
}

function setupCharacter(
  container: DisplayObjectContainer,
  character: DisplayObject,
  action: FrameActionPlaceObject,
  reset: boolean
) {
  if (action.matrix != null) {
    mat2d.copy(character.__node.transformLocal, action.matrix);
    character.__node.transformLocal[4] /= 20;
    character.__node.transformLocal[5] /= 20;
    character.__node.markLayoutDirty();
  } else if (reset) {
    mat2d.identity(character.__node.transformLocal);
    character.__node.markLayoutDirty();
  }

  if (action.colorTransform != null) {
    vec4.copy(
      character.__node.colorTransformLocalMul,
      action.colorTransform.slice(0, 4) as vec4
    );
    vec4.copy(
      character.__node.colorTransformLocalAdd,
      action.colorTransform.slice(4, 8) as vec4
    );
  } else if (reset) {
    vec4.set(character.__node.colorTransformLocalMul, 1, 1, 1, 1);
    vec4.set(character.__node.colorTransformLocalAdd, 0, 0, 0, 0);
  }

  if (action.version <= 1) {
    return;
  }

  if (action.clipDepth != null) {
    character.__clipDepth = action.clipDepth;
  } else if (reset) {
    character.__clipDepth = -1;
  }

  if (character instanceof MorphShape) {
    if (action.ratio != null) {
      character.__ratio = action.ratio;
      character.__character?.applyTo(character);
    } else if (reset) {
      character.__ratio = 0;
      character.__character?.applyTo(character);
    }
  }

  if (action.name != null) {
    character.name = action.name;
    (container as any)[character.name] = character;
  }

  if (action.version <= 2) {
    return;
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
  } else if (reset) {
    character.filters = [];
  }

  if (action.cacheAsBitmap != null) {
    character.cacheAsBitmap = action.cacheAsBitmap;
  } else if (reset) {
    character.cacheAsBitmap = false;
  }

  if (action.visible != null) {
    character.visible = action.visible;
  } else if (reset) {
    character.visible = true;
  }

  // TODO: blendMode
}

export function updateFrameMasks(container: DisplayObjectContainer) {
  const clips: DisplayObject[] = [];
  for (const child of container.__children) {
    if (child.__clipDepth >= 0) {
      clips.push(child);
    }
  }
  for (const child of container.__children) {
    for (const clip of clips) {
      if (child.__depth > clip.__depth && child.__depth <= clip.__clipDepth) {
        child.mask = clip;
      }
    }
  }
}
