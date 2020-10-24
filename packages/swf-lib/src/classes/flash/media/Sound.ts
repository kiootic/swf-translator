import { EventDispatcher } from "../events/EventDispatcher";
import { SoundInstance } from "../../../internal/character/SoundInstance";
import { SoundChannel } from "./SoundChannel";
import { SoundTransform } from "./SoundTransform";
import { Stage } from "../display/Stage";

export class Sound extends EventDispatcher {
  static __character?: SoundInstance;

  readonly __character: SoundInstance | null;

  constructor() {
    super();

    this.__character = (this.constructor as typeof Sound).__character ?? null;
  }

  get length(): number {
    return (this.__character?.audio.duration ?? 0) * 1000;
  }

  play(
    playTime = 0,
    loops = 0,
    transform: SoundTransform | null = null
  ): SoundChannel {
    if (!this.__character) {
      throw new Error("Sound character not exist");
    } else if (!Stage.__current) {
      throw new Error("No stage in context");
    }

    return new SoundChannel(
      Stage.__current,
      this.__character.audio,
      transform ?? new SoundTransform(),
      playTime / 1000,
      loops
    );
  }
}
