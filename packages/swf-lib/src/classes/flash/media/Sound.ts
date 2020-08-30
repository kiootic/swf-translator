import { EventDispatcher } from "../events/EventDispatcher";
import { SoundChannel } from "./SoundChannel";

export class Sound extends EventDispatcher {
  length = 1;

  play(playTime = 0, loops = 0): SoundChannel {
    return new SoundChannel();
  }
}
