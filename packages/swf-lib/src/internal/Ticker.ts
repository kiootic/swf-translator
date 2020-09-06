import { Signal } from "./signal";

export class Ticker {
  readonly onFrame = new Signal<() => void>();

  private animationHandle?: number;
  private readonly targetMS: number;
  private lastTimestamp = 0;

  constructor(readonly fps: number) {
    this.targetMS = 1000 / fps;
  }

  begin() {
    this.end();
    this.animationHandle = requestAnimationFrame(this._onFrame);
  }

  end() {
    if (this.animationHandle != null) {
      cancelAnimationFrame(this.animationHandle);
      this.animationHandle = undefined;
    }
  }

  private _onFrame = (timestamp: DOMHighResTimeStamp) => {
    try {
      if (timestamp - this.lastTimestamp < this.targetMS) {
        return;
      }
      this.lastTimestamp =
        timestamp - ((timestamp - this.lastTimestamp) % this.targetMS);

      this.onFrame.emit();
    } catch (e) {
      console.error(e);
    } finally {
      this.animationHandle = requestAnimationFrame(this._onFrame);
    }
  };
}
