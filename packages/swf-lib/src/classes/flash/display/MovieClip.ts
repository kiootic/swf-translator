import { Sprite } from "./Sprite";
import { runFrame, enqueueFrameScript } from "./frame";

export type MovieClipT<T> = MovieClip & T;

export class MovieClip extends Sprite {
  __lastFrame = 1;
  __constructed = false;
  __frameScripts = new Map<number, () => void>();
  __scriptFrame = 0;

  currentFrame = 1;

  isPlaying = true;

  constructor() {
    super();
  }

  get totalFrames(): number {
    return this.__character?.numFrames ?? 1;
  }

  __initFrame(advance: boolean) {
    super.__initFrame(advance);
    if (advance && this.isPlaying && this.__constructed) {
      this.currentFrame++;
      if (this.currentFrame > this.totalFrames || this.currentFrame < 1) {
        this.currentFrame = 1;
      }
    }
  }

  __constructFrame() {
    super.__constructFrame();
    if (this.__lastFrame !== this.currentFrame) {
      this.__character?.applyTo(this, this.__lastFrame, this.currentFrame);
      this.__lastFrame = this.currentFrame;
    }
    this.__constructed = true;

    if (this.__scriptFrame !== this.currentFrame) {
      enqueueFrameScript(() => this.__runFrameScript());
    }
  }

  __runFrameScript() {
    if (this.__scriptFrame !== this.currentFrame) {
      this.__scriptFrame = this.currentFrame;
      const frameScript = this.__frameScripts.get(this.__scriptFrame);
      frameScript?.();
    }
  }

  addFrameScript(...args: unknown[]) {
    for (let i = 0; i < args.length; i += 2) {
      this.__frameScripts.set(
        (args[i] as number) + 1,
        args[i + 1] as () => void
      );
    }
  }

  __resolveFrame(frameId: unknown): number | null {
    const frameNumber = Number(frameId);
    if (!isNaN(frameNumber)) {
      return frameNumber;
    }
    const frame = this.__character?.frames?.find((f) => f.label === frameId);
    if (frame) {
      return frame.frame;
    }
    return null;
  }

  gotoAndPlay(frame: unknown) {
    const frameNumber = this.__resolveFrame(frame);
    if (frameNumber) {
      this.currentFrame = frameNumber;
    }
    this.isPlaying = true;

    const stage = this.stage;
    if (stage) {
      runFrame(false, stage);
    } else {
      this.__constructFrame();
      this.__runFrameScript();
    }
  }

  gotoAndStop(frame: unknown) {
    const frameNumber = this.__resolveFrame(frame);
    if (frameNumber) {
      this.currentFrame = frameNumber;
    }
    this.isPlaying = false;

    const stage = this.stage;
    if (stage) {
      runFrame(false, stage);
    } else {
      this.__constructFrame();
      this.__runFrameScript();
    }
  }

  play() {
    this.isPlaying = true;
  }

  stop() {
    this.isPlaying = false;
  }
}
