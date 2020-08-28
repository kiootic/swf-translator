import { EventDispatcher } from "../events/EventDispatcher";

export class Sound extends EventDispatcher {
  length = 1;

  play(playTime = 0, loops = 0) {}
}
