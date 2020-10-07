import { SoundChannel } from "./SoundChannel";
import { Sound } from "./Sound";
import { SoundInfo } from "../../__internal/character";
import { AssetLibrary } from "../../__internal";

export class SoundContext {
  private readonly soundChannels = new Map<number, SoundChannel>();

  syncSound(library: AssetLibrary, characterId: number, info: SoundInfo) {
    if (info.syncNoMultiple || info.syncStop) {
      this.soundChannels.get(characterId)?.stop();
      this.soundChannels.delete(characterId);
    }
    if (info.syncStop) {
      return;
    }

    const sound = library.instantiateCharacter(characterId) as Sound;

    let playTime = 0;
    let loops = 1;
    if (info.inPoint != null) {
      playTime = (info.inPoint / sound.__character!.audio.sampleRate) * 1000;
    }
    if (info.loopCount != null) {
      loops = info.loopCount;
    }

    const channel = sound.play(playTime, loops);
    this.soundChannels.set(characterId, channel);
  }

  stopSound(characterId: number) {
    this.soundChannels.get(characterId)?.stop();
  }
}
