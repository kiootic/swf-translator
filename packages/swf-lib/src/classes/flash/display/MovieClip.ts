import { observable } from "mobx";
import { Sprite } from "./Sprite";

export class MovieClip extends Sprite {
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
    const lastFrame = this.currentFrame;
    if (this.isPlaying) {
      this.currentFrame++;
      if (this.currentFrame > this.totalFrames) {
        this.currentFrame = 1;
      }
    }

    if (this.currentFrame !== lastFrame) {
      this.__character?.applyTo(this, this.currentFrame);
    }

    super.__onNewFrame();
  }
}
