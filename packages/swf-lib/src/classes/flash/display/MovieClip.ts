import { observable } from "mobx";
import { Sprite } from "./Sprite";

export type MovieClipT<T> = MovieClip & T;

export class MovieClip extends Sprite {
  #lastFrame = 1;
  #frameScripts = new Map<number, () => void>();

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

      this.#frameScripts.get(this.currentFrame)?.();
    }

    super.__onNewFrame();
  }

  addFrameScript(...args: unknown[]) {
    for (let i = 0; i < args.length; i += 2) {
      this.#frameScripts.set(
        (args[i] as number) + 1,
        args[i + 1] as () => void
      );
    }
  }

  gotoAndPlay(frame: unknown) {
    const frameNumber = Number(frame);
    if (!isNaN(frameNumber)) {
      this.currentFrame = frameNumber;
    }
    this.isPlaying = true;
  }

  gotoAndStop(frame: unknown) {
    const frameNumber = Number(frame);
    if (!isNaN(frameNumber)) {
      this.currentFrame = frameNumber;
    }
    this.isPlaying = false;
  }

  play() {
    this.isPlaying = true;
  }

  stop() {
    this.isPlaying = false;
  }
}
