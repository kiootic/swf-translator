import { Sprite } from "../../classes/flash/display/Sprite";
import {
  SpriteCharacter,
  SpriteFrame,
  FrameActionKind,
  FrameAction,
  FrameActionStartSound,
} from "../../classes/__internal/character/Sprite";
import type { AssetLibrary } from "../../classes/__internal";
import { CharacterInstance } from "./CharacterInstance";
import {
  executeActionPlaceObject,
  executeActionRemoveObject,
  updateFrameMasks,
  executeActionStartSound,
} from "./frame";

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
    const effectiveActions = new Map<number, FrameAction>();
    const soundActions: FrameActionStartSound[] = [];
    const setActions = (frameNum: number) => {
      const frame = this.frames.find((f) => f.frame === frameNum);
      if (!frame) {
        return;
      }

      soundActions.length = 0;
      for (const action of frame.actions) {
        if (action.kind === FrameActionKind.StartSound) {
          soundActions.push(action);
          continue;
        }

        const ea = effectiveActions.get(action.depth);
        if (!ea || ea.kind !== action.kind) {
          effectiveActions.set(action.depth, action);
        } else if (ea.kind === FrameActionKind.PlaceObject) {
          effectiveActions.set(action.depth, {
            ...ea,
            ...action,
          });
        }
      }
    };

    if (thisFrameNum >= prevFrameNum) {
      for (let i = prevFrameNum; i <= thisFrameNum; i++) {
        setActions(i);
      }
    } else {
      // Reset timeline on frame 1
      for (const child of sprite.__children) {
        if (child.__depth >= 0) {
          effectiveActions.set(child.__depth, {
            kind: FrameActionKind.RemoveObject,
            depth: child.__depth,
          });
        }
      }
      for (let i = 1; i <= thisFrameNum; i++) {
        setActions(i);
      }
    }

    for (const action of effectiveActions.values()) {
      switch (action.kind) {
        case FrameActionKind.PlaceObject:
          executeActionPlaceObject(this.library, sprite, action);
          break;
        case FrameActionKind.RemoveObject:
          executeActionRemoveObject(sprite, action);
          break;
      }
    }

    for (const action of soundActions) {
      executeActionStartSound(this.library, sprite.__soundContext, action);
    }

    updateFrameMasks(sprite);
  }
}
