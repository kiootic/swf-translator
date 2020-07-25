import { runInAction } from "mobx";
import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { Properties } from "../../_internal/Properties";
import { Canvas } from "../../../internal/render/Canvas";
import { Ticker } from "../../../internal/render/Ticker";
import { Renderer } from "../../../internal/render/Renderer";

export class Stage extends DisplayObjectContainer {
  readonly __canvas = new Canvas();
  readonly __ticker: Ticker;
  readonly __renderer: Renderer;

  constructor(properties?: Properties) {
    super();
    this.__renderer = new Renderer(this.__canvas);

    let tickFPS = 60;
    if (properties) {
      const { width, height, backgroundColor, fps } = properties;
      this.__renderer.backgroundColor = backgroundColor;
      this.__canvas.width = width / 20;
      this.__canvas.height = height / 20;
      tickFPS = fps;
    }

    this.__ticker = new Ticker(tickFPS);
    this.__ticker.onFrame.subscribe(this.__onFrame);
    this.__ticker.begin();
  }

  __onFrame = () => {
    runInAction(() => this.__onNewFrame());

    this.__renderer.renderFrame((ctx) => {
      this.__render(ctx);
    });
  };
}
