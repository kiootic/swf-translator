import { runInAction } from "mobx";
import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { InteractiveObject } from "./InteractiveObject";
import { Point } from "../geom/Point";
import { Properties } from "../../_internal/Properties";
import { Canvas } from "../../../internal/render/Canvas";
import { Ticker } from "../../../internal/render/Ticker";
import { Renderer } from "../../../internal/render/Renderer";
import { vec2 } from "gl-matrix";

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

  __hitTestObject(x: number, y: number): InteractiveObject | null {
    const hitTest = (
      point: Point,
      target: InteractiveObject
    ): InteractiveObject | null => {
      if (!(target instanceof DisplayObjectContainer)) {
        return target;
      }

      const childPoint = new Point();
      const children = target.__children;
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (!(child instanceof InteractiveObject)) {
          continue;
        }

        child.globalToLocal(point, childPoint);
        if (!child.hitTestPoint(childPoint.x, childPoint.y)) {
          continue;
        }

        return hitTest(childPoint, child);
      }
      return null;
    };
    return hitTest(new Point(x, y), this);
  }
}
