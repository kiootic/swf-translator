interface SoundSource {
  __updateSoundTransform(): void;
}

export class SoundTransform {
  __source: SoundSource | null = null;
  private __volume: number;

  get volume() {
    return this.__volume;
  }
  set volume(value) {
    this.__volume = value;
    this.__source?.__updateSoundTransform();
  }

  constructor(volume = 1) {
    this.__volume = volume;
  }
}
