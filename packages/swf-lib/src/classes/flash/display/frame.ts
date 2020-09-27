import type { Stage } from "./Stage";
import type { DisplayObject } from "./DisplayObject";
import { Event } from "../events/Event";
import { __broadcastDispatcher } from "../events/EventDispatcher";

const frameScriptQueue: Array<() => void> = [];

export function enqueueFrameScript(script: () => void) {
  frameScriptQueue.push(script);
}

// ref: https://github.com/mozilla/shumway/blob/16451d8836fa85f4b16eeda8b4bda2fa9e2b22b0/src/flash/display/DisplayObject.ts#L422
export function runFrame(isRoot: boolean, stage: Stage) {
  iterateDisplayObject(stage, (o) => {
    o.__initFrame(isRoot);
  });

  if (isRoot) {
    __broadcastDispatcher.dispatchEvent(
      new Event(Event.ENTER_FRAME, false, false)
    );
  }

  iterateDisplayObject(stage, (o) => {
    o.__constructFrame();
  });

  const scripts = frameScriptQueue.slice();
  frameScriptQueue.length = 0;
  for (const script of scripts) {
    script();
  }
}

function iterateDisplayObject(
  o: DisplayObject,
  fn: (o: DisplayObject) => void
) {
  const queue: DisplayObject[] = [o];
  let i = 0;
  while (i < queue.length) {
    fn(queue[i]);
    queue[i].__getChildren(queue);
    i++;
  }
}
