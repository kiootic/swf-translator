import { observable } from "mobx";
import { Sprite } from "./Sprite";

export type MovieClipT<T> = MovieClip & T;

export class MovieClip extends Sprite {
  #lastFrame: number | null = null;
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
    if (this.#lastFrame !== null && this.isPlaying) {
      this.currentFrame++;
      if (this.currentFrame > this.totalFrames || this.currentFrame < 1) {
        this.currentFrame = 1;
      }
    }

    let frameScript: (() => void) | null = null;
    if (this.currentFrame !== this.#lastFrame) {
      this.__character?.applyTo(
        this,
        this.#lastFrame ?? this.currentFrame,
        this.currentFrame
      );
      this.#lastFrame = this.currentFrame;

      frameScript = this.#frameScripts.get(this.currentFrame) ?? null;
    }

    super.__onNewFrame();

    frameScript?.();
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
