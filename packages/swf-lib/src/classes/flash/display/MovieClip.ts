import { observable } from "mobx";
import { Sprite } from "./Sprite";

export class MovieClip extends Sprite {
  #lastFrame = 1;

  @observable
  currentFrame = 1;

  @observable
  isPlaying = true;

  constructor() {
    super();
  }

  get totalFrames(): number {
    return this.__character?.numFrames ?? 1;
  }

  __onNewFrame() {
    if (this.isPlaying) {
      this.currentFrame++;
      if (this.currentFrame > this.totalFrames || this.currentFrame < 1) {
        this.currentFrame = 1;
      }
    }

    if (this.currentFrame !== this.#lastFrame) {
      this.__character?.applyTo(this, this.#lastFrame, this.currentFrame);
      this.#lastFrame = this.currentFrame;
    }

    super.__onNewFrame();
  }
}
