import { Application, Ticker } from "pixi.js";
import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { Properties } from "../../_internal/Properties";

export class Stage extends DisplayObjectContainer {
  readonly __app = new Application({ antialias: true });
  readonly __ticker = new Ticker();

  constructor(properties?: Properties) {
    super();
    this.__app.stage.addChild(this.__pixi);
    this.__app.stage.scale.set(1 / 20, 1 / 20);

    if (properties) {
      const { width, height, backgroundColor, fps } = properties;
      this.__app.renderer.backgroundColor = backgroundColor;
      this.__app.renderer.resize(width / 20, height / 20);
      this.__ticker.maxFPS = fps;
    }

    this.__ticker.start();
  }
}
