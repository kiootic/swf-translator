import { SoundTransform } from "./SoundTransform";
import { Stage } from "../display/Stage";

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
    if (!Stage.__current) {
      throw new Error("No stage in context");
    }
    Stage.__current.__audio.reset();
    SoundMixer.__updateSoundTransform();
  }

  static __updateSoundTransform() {
    if (!Stage.__current) {
      throw new Error("No stage in context");
    }
    Stage.__current.__audio.rootNode.gain.setValueAtTime(
      this.soundTransform.volume,
      Stage.__current.__audio.context.currentTime
    );
  }
}
