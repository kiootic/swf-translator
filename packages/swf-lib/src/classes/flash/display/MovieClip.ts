import { observable } from "mobx";
import { Sprite } from "./Sprite";

export type MovieClipT<T> = MovieClip & T;

export class MovieClip extends Sprite {
  #lastFrame = 1;
  #frameScripts = new Map<number, () => void>();
  #scriptFrame = 0;

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

  __onFrameEnter() {
    if (this.currentFrame !== this.#lastFrame) {
      this.__character?.applyTo(this, this.#lastFrame, this.currentFrame);
      this.#lastFrame = this.currentFrame;
    }

    super.__onFrameEnter();
  }

  __onFrameConstruct() {
    if (this.#scriptFrame !== this.currentFrame) {
      this.#scriptFrame = this.currentFrame;
      const frameScript = this.#frameScripts.get(this.#scriptFrame);
      frameScript?.();
    }
    super.__onFrameConstruct();
  }

  __onFrameExit() {
    if (this.isPlaying) {
      this.currentFrame++;
      if (this.currentFrame > this.totalFrames || this.currentFrame < 1) {
        this.currentFrame = 1;
      }
    }

    super.__onFrameExit();
  }

  addFrameScript(...args: unknown[]) {
    for (let i = 0; i < args.length; i += 2) {
      this.#frameScripts.set(
        (args[i] as number) + 1,
        args[i + 1] as () => void
      );
    }
  }

  #resolveFrame = (frameId: unknown): number | null => {
    const frameNumber = Number(frameId);
    if (!isNaN(frameNumber)) {
      return frameNumber;
    }
    const frame = this.__character?.frames?.find((f) => f.label === frameId);
    if (frame) {
      return frame.frame;
    }
    return null;
  };

  gotoAndPlay(frame: unknown) {
    const frameNumber = this.#resolveFrame(frame);
    if (frameNumber) {
      this.currentFrame = frameNumber;
    }
    this.isPlaying = true;
  }

  gotoAndStop(frame: unknown) {
    const frameNumber = this.#resolveFrame(frame);
    if (frameNumber) {
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
