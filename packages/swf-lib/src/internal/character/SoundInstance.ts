import { CharacterInstance } from "./CharacterInstance";

export class SoundInstance implements CharacterInstance {
  constructor(readonly id: number, readonly audio: AudioBuffer) {}
}
