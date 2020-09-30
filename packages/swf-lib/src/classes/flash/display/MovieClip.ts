import { Sprite } from "./Sprite";
import { runFrame, enqueueFrameScript } from "./frame";
import { Stage } from "./Stage";

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

  __initFrame(stage: Stage) {
    super.__initFrame(stage);

    if (this.isPlaying && this.__constructed) {
      let newFrame = this.currentFrame + 1;
      if (newFrame > this.totalFrames || newFrame < 1) {
        newFrame = 1;
      }
      if (this.currentFrame !== newFrame) {
        this.currentFrame = newFrame;
        stage.__constructionQueue.push(this);
      }
    } else if (!this.__constructed) {
      stage.__constructionQueue.push(this);
    }
  }

  __constructFrame() {
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
      stage.__constructionQueue.push(this);
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
      stage.__constructionQueue.push(this);
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

  __onAddToStage(stage: Stage) {
    super.__onAddToStage(stage);
    stage.__constructionQueue.push(this);
  }
}
