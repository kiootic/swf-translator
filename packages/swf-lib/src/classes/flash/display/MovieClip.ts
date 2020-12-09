import { Sprite } from "./Sprite";
import { runFrame, enqueueFrameScript } from "./frame";
import { Stage } from "./Stage";

export type MovieClipT<T> = MovieClip & T;

export class MovieClip extends Sprite {
  __lastFrame = -1;
  __constructed = false;
  __frameScripts = new Map<number, () => void>();
  __scriptFrame = 0;
  __nextFrame = 1;

  currentFrame = 1;

  isPlaying = true;

  constructor() {
    super();
  }

  get totalFrames(): number {
    return this.__character?.numFrames ?? 1;
  }

  __initFrame(stage: Stage, isRoot: boolean) {
    super.__initFrame(stage, isRoot);

    if (isRoot) {
      // Only play next frame when the current frame had been init from root once.
      if (
        this.isPlaying &&
        this.__constructed &&
        this.__lastFrame === this.currentFrame
      ) {
        let newFrame = this.__nextFrame + 1;
        if (newFrame > this.totalFrames || newFrame < 1) {
          newFrame = 1;
        }
        this.__nextFrame = newFrame;
      }
    }

    if (this.__nextFrame !== this.currentFrame) {
      this.__character?.applyTo(this, this.currentFrame, this.__nextFrame);

      this.currentFrame = this.__nextFrame;
    }

    if (!this.__constructed) {
      stage.__constructionQueue.push(this);
    }

    if (this.__scriptFrame !== this.currentFrame) {
      enqueueFrameScript(() => this.__runFrameScript());
    }

    if (isRoot) {
      this.__lastFrame = this.currentFrame;
    }
  }

  __constructFrame() {
    this.__constructed = true;
    // TODO: Call constructor of children here.
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
      this.__nextFrame = frameNumber;
    }
    this.isPlaying = true;

    const stage = this.stage ?? Stage.__current;
    if (stage) {
      stage.__initQueue.push(this);
      runFrame(false, stage);
    }
  }

  gotoAndStop(frame: unknown) {
    const frameNumber = this.__resolveFrame(frame);
    if (frameNumber) {
      this.__nextFrame = frameNumber;
    }
    this.isPlaying = false;

    const stage = this.stage ?? Stage.__current;
    if (stage) {
      stage.__initQueue.push(this);
      runFrame(false, stage);
    }
  }

  play() {
    this.isPlaying = true;
  }

  stop() {
    this.isPlaying = false;
  }

  __onAddedToStage(stage: Stage) {
    super.__onAddedToStage(stage);
    stage.__initQueue.push(this);
  }
}
