import { runInAction } from "mobx";
import { DisplayObject } from "./DisplayObject";
import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { InteractiveObject } from "./InteractiveObject";
import { Point } from "../geom/Point";
import { Properties } from "../../_internal/Properties";
import { Canvas } from "../../../internal/render/Canvas";
import { Ticker } from "../../../internal/render/Ticker";
import { Renderer } from "../../../internal/render/Renderer";
import { MouseEvent } from "../events";

export class Stage extends DisplayObjectContainer {
  readonly __canvas = new Canvas();
  readonly __ticker: Ticker;
  readonly __renderer: Renderer;

  __mouseOn: DisplayObject | null = null;

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

    this.__canvas.canvas.addEventListener("mouseenter", this.#handleMouseEvent);
    this.__canvas.canvas.addEventListener("mousemove", this.#handleMouseEvent);
    this.__canvas.canvas.addEventListener("mousedown", this.#handleMouseEvent);
    this.__canvas.canvas.addEventListener("mouseup", this.#handleMouseEvent);
    this.__canvas.canvas.addEventListener("mouseleave", this.#handleMouseEvent);
    this.__canvas.canvas.addEventListener("click", this.#handleMouseEvent);
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

  #handleMouseEvent = (sourceEvent: globalThis.MouseEvent) => {
    const rect = this.__canvas.canvas.getBoundingClientRect();
    const x = sourceEvent.clientX - rect.left;
    const y = sourceEvent.clientY - rect.top;
    const target = this.__hitTestObject(x, y);

    const isMouseDown = sourceEvent.buttons !== 0;
    const newMouseEvent = (type: string) => {
      const event = new MouseEvent();
      event.type = type;
      event.buttonDown = isMouseDown;
      return event;
    };

    const mouseOn = (obj: DisplayObject | null) => {
      if (this.__mouseOn === obj) {
        return;
      }
      this.__mouseOn?.dispatchEvent(newMouseEvent(MouseEvent.MOUSE_OUT));
      this.__mouseOn = obj;
      this.__mouseOn?.dispatchEvent(newMouseEvent(MouseEvent.MOUSE_OVER));
    };

    mouseOn(sourceEvent.type === "mouseleave" ? null : target);
    switch (sourceEvent.type) {
      case "mouseenter":
      case "mouseleave":
        break;
      case "mousemove":
        this.__mouseOn?.dispatchEvent(newMouseEvent(MouseEvent.MOUSE_MOVE));
        break;
      case "mousedown":
        this.__mouseOn?.dispatchEvent(newMouseEvent(MouseEvent.MOUSE_DOWN));
        break;
      case "mouseup":
        this.__mouseOn?.dispatchEvent(newMouseEvent(MouseEvent.MOUSE_UP));
        break;
      case "click":
        this.__mouseOn?.dispatchEvent(newMouseEvent(MouseEvent.CLICK));
        break;
    }
  };
}
