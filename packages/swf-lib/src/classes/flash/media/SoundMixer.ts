import { SoundTransform } from "./SoundTransform";
import { channels } from "./channels";
import { Audio, globalVolumeNode } from "../../../internal/audio";

export class SoundMixer {
  private static __soundTransform = new SoundTransform();

  static get soundTransform() {
    return SoundMixer.__soundTransform;
  }

  static set soundTransform(value) {
    SoundMixer.__soundTransform.__source = null;
    SoundMixer.__soundTransform = value;
    SoundMixer.__soundTransform.__source = SoundMixer;
    SoundMixer.__updateSoundTransform();
  }

  static stopAll() {
    for (const channel of channels) {
      channel.stop();
    }
  }

  static __updateSoundTransform() {
    globalVolumeNode.gain.setValueAtTime(
      this.soundTransform.volume,
      Audio.currentTime
    );
  }
}
