import { Sprite } from "../../classes/flash/display/Sprite";
import {
  SpriteCharacter,
  SpriteFrame,
  FrameActionKind,
  FrameAction,
} from "../../classes/_internal/character/Sprite";
import type { AssetLibrary } from "../../classes/_internal";
import { CharacterInstance } from "./CharacterInstance";
import { executeFrameAction } from "./frame";

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
    interface EffectiveAction {
      frame: number;
      action: FrameAction;
    }

    // ref: https://github.com/mozilla/shumway/blob/16451d8836fa85f4b16eeda8b4bda2fa9e2b22b0/src/flash/display/Sprite.ts#L147
    const effectiveActions = new Map<number, EffectiveAction>();
    const setActions = (frameNum: number) => {
      if (frameNum === 1) {
        // Reset timeline on frame 1
        for (const child of sprite.__children) {
          if (child.__depth >= 0) {
            effectiveActions.set(child.__depth, {
              frame: frameNum,
              action: {
                kind: FrameActionKind.RemoveObject,
                depth: child.__depth,
              },
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
        if (!ea || ea.action.kind !== action.kind) {
          effectiveActions.set(action.depth, { frame: frameNum, action });
        } else {
          effectiveActions.set(action.depth, {
            frame: frameNum,
            action: { ...(ea.action || {}), ...action },
          });
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

    for (const { frame, action } of effectiveActions.values()) {
      executeFrameAction(this.library, sprite, frame, action);
    }
  }
}
