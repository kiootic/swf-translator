import { Sprite } from "./Sprite";

export class MovieClip extends Sprite {
  #currentFrame = 1;
  #isPlaying = true;

  constructor() {
    super();
  }

  get currentFrame(): number {
    return this.#currentFrame;
  }

  get totalFrames(): number {
    return this.__character?.numFrames ?? 1;
  }

  get isPlayer(): boolean {
    return this.#isPlaying;
  }

  __onNewFrame() {
    const lastFrame = this.#currentFrame;
    if (this.#isPlaying) {
      this.#currentFrame++;
      if (this.#currentFrame > this.totalFrames) {
        this.#currentFrame = 1;
      }
    }

    if (this.#currentFrame !== lastFrame) {
      this.__character?.applyTo(this.__pixi, this.#currentFrame);
    }
  }
}
