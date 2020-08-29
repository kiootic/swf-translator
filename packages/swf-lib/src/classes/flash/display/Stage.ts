import { runInAction, computed } from "mobx";
import { vec2 } from "gl-matrix";
import { DisplayObject } from "./DisplayObject";
import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { InteractiveObject } from "./InteractiveObject";
import { Point } from "../geom/Point";
import { Properties } from "../../__internal/Properties";
import { Canvas } from "../../../internal/render/Canvas";
import { Ticker } from "../../../internal/render/Ticker";
import { Renderer } from "../../../internal/render/Renderer";
import { MouseEvent } from "../events";

export class Stage extends DisplayObjectContainer {
  readonly __canvas = new Canvas();
  readonly __ticker: Ticker;
  readonly __renderer: Renderer;

  __mousePosition = vec2.create();
  __mouseOn: InteractiveObject | null = null;
  __mouseTrackTarget: InteractiveObject | null = null;

  focus: InteractiveObject | null = null;
  quality: string = "HIGH";

  @computed
  get stage() {
    return this;
  }

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
    runInAction(() => this.__onFrameEnter());
    runInAction(() => this.__onFrameConstruct());
    runInAction(() => this.__onFrameExit());

    this.__renderer.renderFrame((ctx) => {
      this.__render(ctx);
    });
  };

  __hitTestObject(x: number, y: number): InteractiveObject | null {
    const globalPoint = new Point(x, y);
    const childPoint = new Point();
    const hitTest = (target: InteractiveObject): InteractiveObject | null => {
      if (!(target instanceof DisplayObjectContainer)) {
        return target;
      }

      const children = target.__children;
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (!(child instanceof InteractiveObject)) {
          continue;
        }

        child.globalToLocal(globalPoint, childPoint);
        if (!child.hitTestPoint(childPoint.x, childPoint.y)) {
          continue;
        }

        const hit = hitTest(child);
        if (hit) {
          return hit;
        }
      }
      return null;
    };
    return hitTest(this);
  }

  #handleMouseEvent = (sourceEvent: globalThis.MouseEvent) => {
    const rect = this.__canvas.canvas.getBoundingClientRect();
    const x = sourceEvent.clientX - rect.left;
    const y = sourceEvent.clientY - rect.top;
    vec2.set(this.__mousePosition, x, y);
    let target = this.__hitTestObject(x, y);

    const dispatchMouseEvent = (type: string, target: DisplayObject | null) => {
      if (!target) {
        return;
      }
      const { x: localX, y: localY } = target.globalToLocal(new Point(x, y));

      const event = new MouseEvent(type);
      event.buttonDown = sourceEvent.buttons !== 0;
      event.localX = localX;
      event.localY = localY;
      target.dispatchEvent(event);
    };

    if (this.__mouseTrackTarget) {
      if (this.__mouseTrackTarget.stage !== this) {
        this.__mouseTrackTarget = null;
      }
      target = this.__mouseTrackTarget;
    }
    if (sourceEvent.type === "mouseleave") {
      target = null;
    }

    if (this.__mouseOn !== target) {
      dispatchMouseEvent(MouseEvent.MOUSE_OUT, this.__mouseOn);
      this.__mouseOn = target;
      dispatchMouseEvent(MouseEvent.MOUSE_OVER, this.__mouseOn);
    }

    switch (sourceEvent.type) {
      case "mousemove":
        dispatchMouseEvent(MouseEvent.MOUSE_MOVE, this.__mouseOn);
        break;
      case "mousedown":
        dispatchMouseEvent(MouseEvent.MOUSE_DOWN, this.__mouseOn);
        break;
      case "mouseup":
        dispatchMouseEvent(MouseEvent.MOUSE_UP, this.__mouseOn);
        break;
      case "click":
        dispatchMouseEvent(MouseEvent.CLICK, this.__mouseOn);
        break;
    }

    if (this.__mouseOn) {
      this.__canvas.cursor = this.__mouseOn.__isPointerCursor
        ? "pointer"
        : "default";
    } else {
      this.__canvas.cursor = "default";
    }
  };
}
