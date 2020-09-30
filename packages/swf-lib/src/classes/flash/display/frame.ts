import type { Stage } from "./Stage";
import type { DisplayObject } from "./DisplayObject";
import type { MovieClip } from "./MovieClip";
import { Event } from "../events/Event";
import { __broadcastDispatcher } from "../events/EventDispatcher";
import { SceneNode } from "../../../internal/render2/SceneNode";

const frameScriptQueue: Array<() => void> = [];

export function enqueueFrameScript(script: () => void) {
  frameScriptQueue.push(script);
}

const frameInitQueue: Array<MovieClip> = [];
const frameConstructQueue: Array<MovieClip> = [];

// ref: https://github.com/mozilla/shumway/blob/16451d8836fa85f4b16eeda8b4bda2fa9e2b22b0/src/flash/display/DisplayObject.ts#L422
export function runFrame(isRoot: boolean, stage: Stage) {
  stage.__ensureDisplayList();
  for (const o of stage.__displayList.slice()) {
    o.__initFrame(isRoot);
  }

  if (isRoot) {
    __broadcastDispatcher.dispatchEvent(
      new Event(Event.ENTER_FRAME, false, false)
    );
  }

  stage.__ensureDisplayList();
  for (const o of stage.__displayList.slice()) {
    o.__constructFrame();
  }

  const scripts = frameScriptQueue.slice();
  frameScriptQueue.length = 0;
  for (const script of scripts) {
    script();
  }
}
