import { EventDispatcher } from "../events/EventDispatcher";

export class Timer extends EventDispatcher {
  constructor(public delay = 0, repeatCount = 0) {
    super();
  }

  start() {}
  stop() {}
}
