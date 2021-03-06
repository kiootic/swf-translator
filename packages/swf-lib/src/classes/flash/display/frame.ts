import type { Stage } from "./Stage";
import { Event } from "../events/Event";
import { EventDispatcher } from "../events/EventDispatcher";

const frameScriptQueue: Array<() => void> = [];

export function enqueueFrameScript(script: () => void) {
  frameScriptQueue.push(script);
}

// ref: https://github.com/mozilla/shumway/blob/16451d8836fa85f4b16eeda8b4bda2fa9e2b22b0/src/flash/display/DisplayObject.ts#L422
export function runFrame(isRoot: boolean, stage: Stage) {
  stage.__ensureDisplayList();
  const initQueue = new Set([...stage.__displayList, ...stage.__initQueue]);
  stage.__initQueue.length = 0;
  for (const o of initQueue) {
    o.__initFrame(stage, isRoot);
  }

  if (isRoot) {
    EventDispatcher.__broadcastDispatcher.dispatchEvent(
      new Event(Event.ENTER_FRAME, false, false)
    );
  }

  while (stage.__constructionQueue.length > 0) {
    const queue = stage.__constructionQueue.slice();
    stage.__constructionQueue.length = 0;
    for (const o of queue) {
      o.__constructFrame();
    }
  }

  const scripts = frameScriptQueue.slice();
  frameScriptQueue.length = 0;
  for (const script of scripts) {
    script();
  }
}
