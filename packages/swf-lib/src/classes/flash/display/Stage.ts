import { vec2 } from "gl-matrix";
import { DisplayObject } from "./DisplayObject";
import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { InteractiveObject } from "./InteractiveObject";
import { Point } from "../geom/Point";
import { Properties } from "../../__internal/Properties";
import { Canvas } from "../../../internal/render/Canvas";
import { Ticker } from "../../../internal/render/Ticker";
import { Renderer } from "../../../internal/render/Renderer";
import { Event } from "../events/Event";
import { MouseEvent } from "../events/MouseEvent";
import { KeyboardEvent } from "../events/KeyboardEvent";
import { Keyboard } from "../ui";

export class Stage extends DisplayObjectContainer {
  readonly __canvas = new Canvas();
  readonly __ticker: Ticker;
  readonly __renderer: Renderer;

  __mousePosition = vec2.create();
  __mouseOn: InteractiveObject | null = null;
  __mouseTrackTarget: InteractiveObject | null = null;

  focus: InteractiveObject | null = null;
  quality: string = "HIGH";

  get loaderInfo() {
    return {
      bytesTotal: 100,
      bytesLoaded: 100,
      url: window.location.href,
    };
  }

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
    this.__canvas.canvas.addEventListener("keydown", this.#handleKeyboardEvent);
    this.__canvas.canvas.addEventListener("keyup", this.#handleKeyboardEvent);
    this.__canvas.canvas.addEventListener("blur", this.#handleFocusEvent);
  }

  __onFrame = () => {
    this.__onFrameEnter();
    this.__onFrameConstruct();
    this.__onFrameExit();

    this.__node.updateWorldTransform();
    this.__node.updateWorldColorTransform();
    this.__renderer.renderFrame((ctx) => {
      this.__node.render(ctx);
    });
  };

  __hitTestObject(x: number, y: number): InteractiveObject | null {
    const pt = vec2.fromValues(x, y);
    this.__node.updateWorldTransform();

    const hitTest = (target: InteractiveObject): InteractiveObject | null => {
      if (!(target instanceof DisplayObjectContainer)) {
        return target;
      }

      const children = target.__children;
      let hitSelf = false;
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (!child.visible) {
          continue;
        }

        if (!child.__node.hitTest(pt, false)) {
          continue;
        }

        if (child instanceof InteractiveObject) {
          const hit = hitTest(child);
          if (hit) {
            return hit;
          }
        } else {
          hitSelf = true;
        }
      }
      return hitSelf ? target : null;
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

      const event = new MouseEvent(type, true, false);
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

  #handleKeyboardEvent = (sourceEvent: globalThis.KeyboardEvent) => {
    const keyCode = Keyboard.codeMap[sourceEvent.code];
    if (!keyCode) {
      return;
    }

    let event: KeyboardEvent;
    switch (sourceEvent.type) {
      case "keydown":
        event = new KeyboardEvent(KeyboardEvent.KEY_DOWN, true, false);
        break;
      case "keyup":
        event = new KeyboardEvent(KeyboardEvent.KEY_UP, true, false);
        break;
      default:
        return;
    }
    event.keyCode = keyCode;
    (this.focus ?? this).dispatchEvent(event);
  };

  #handleFocusEvent = (sourceEvent: globalThis.FocusEvent) => {
    let event: Event;
    switch (sourceEvent.type) {
      case "blur":
        event = new Event(Event.DEACTIVATE, true, false);
        break;
      default:
        return;
    }
    this.dispatchEvent(event);
  };
}
