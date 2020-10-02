import { Signal } from "./signal";

export class Ticker {
  readonly onFrame = new Signal<() => void>();
  readonly onRender = new Signal<() => void>();

  private animationHandle?: number;
  private readonly channel = new MessageChannel();
  private readonly targetMS: number;
  private lastTimestamp = 0;
  private needRender = false;

  constructor(readonly fps: number) {
    this.targetMS = 1000 / fps;
    this.channel.port1.onmessage = () => {
      this._onFrame();
    };
  }

  begin() {
    this.end();
    this.animationHandle = requestAnimationFrame(this._onRender);
  }

  end() {
    if (this.animationHandle != null) {
      cancelAnimationFrame(this.animationHandle);
      this.animationHandle = undefined;
    }
  }

  private _onFrame = () => {
    try {
      this.onFrame.emit();
    } catch (e) {
      console.error(e);
    }
    this.needRender = true;
  };

  private _onRender = (timestamp: DOMHighResTimeStamp) => {
    const last = this.lastTimestamp;
    if (timestamp - last >= this.targetMS) {
      this.lastTimestamp = timestamp - ((timestamp - last) % this.targetMS);
      this.channel.port2.postMessage(null);
    }

    if (this.needRender) {
      try {
        this.onRender.emit();
      } catch (e) {
        console.error(e);
      }
      this.needRender = false;
    }

    this.animationHandle = requestAnimationFrame(this._onRender);
  };
}
