import { vec2 } from "gl-matrix";
import { DisplayObject } from "./DisplayObject";
import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { InteractiveObject } from "./InteractiveObject";
import { Properties } from "../../__internal/Properties";
import { Canvas } from "../../../internal/render2/Canvas";
import { Renderer } from "../../../internal/render2/Renderer";
import { Ticker } from "../../../internal/Ticker";
import { Event } from "../events/Event";
import { MouseEvent } from "../events/MouseEvent";
import { KeyboardEvent } from "../events/KeyboardEvent";
import { Keyboard } from "../ui/Keyboard";
import { runFrame } from "./frame";

const tmpVec2 = vec2.create();

interface Constructible {
  __constructFrame(): void;
}

export class Stage extends DisplayObjectContainer {
  static __current: Stage | null = null;

  readonly __canvas: Canvas;
  readonly __ticker: Ticker;
  readonly __renderer: Renderer;

  __displayListDirty = false;
  readonly __displayList: DisplayObject[] = [];
  readonly __constructionQueue: Constructible[] = [];

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

    let fps = 60;
    let backgroundColor = 0x000000;
    let width = 600;
    let height = 400;
    if (properties) {
      ({ width, height, backgroundColor, fps } = properties);
      width /= 20;
      height /= 20;
    }

    this.__canvas = new Canvas(width, height);
    this.__renderer = new Renderer(this.__canvas);
    this.__renderer.backgroundColor = backgroundColor;

    this.__ticker = new Ticker(fps);
    this.__ticker.onFrame.subscribe(this.__onFrame);
    this.__ticker.onRender.subscribe(this.__doRender);
    this.__ticker.begin();

    const canvas = this.__canvas.element;
    canvas.addEventListener("mouseenter", this.#handleMouseEvent);
    canvas.addEventListener("mousemove", this.#handleMouseEvent);
    canvas.addEventListener("mousedown", this.#handleMouseEvent);
    canvas.addEventListener("mouseup", this.#handleMouseEvent);
    canvas.addEventListener("mouseleave", this.#handleMouseEvent);
    canvas.addEventListener("click", this.#handleMouseEvent);
    canvas.addEventListener("keydown", this.#handleKeyboardEvent);
    canvas.addEventListener("keyup", this.#handleKeyboardEvent);
    canvas.addEventListener("blur", this.#handleFocusEvent);
  }

  __onFrame = this.__withContext(() => {
    runFrame(true, this);
    if (this.__renderer.glState.hasContext) {
      this.__onRender();
      this.__renderer.renderFrame(this.__node);
    }
  });

  __doRender = this.__withContext(() => {
    if (this.__renderer.glState.hasContext) {
      this.__renderer.blitFrame();
    }
  });

  __withContext<T extends Function>(fn: T): T {
    return (((...args: unknown[]) => {
      const p = Stage.__current;
      Stage.__current = this;
      try {
        return fn(...args);
      } finally {
        Stage.__current = p;
      }
    }) as unknown) as T;
  }

  __hitTestObject(pt: vec2): InteractiveObject | null {
    this.__node.ensureLayout();

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

  #handleMouseEvent = this.__withContext(
    (sourceEvent: globalThis.MouseEvent) => {
      this.__canvas.resolveCoords(
        this.__mousePosition,
        sourceEvent.clientX,
        sourceEvent.clientY
      );
      let target = this.__hitTestObject(this.__mousePosition);

      const dispatchMouseEvent = (
        type: string,
        target: DisplayObject | null
      ) => {
        if (!target) {
          return;
        }
        target.__globalToLocal(tmpVec2, this.__mousePosition, false);

        const event = new MouseEvent(type, true, false);
        event.buttonDown = sourceEvent.buttons !== 0;
        event.localX = tmpVec2[0];
        event.localY = tmpVec2[1];
        event.stageX = this.__mousePosition[0];
        event.stageY = this.__mousePosition[1];
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
    }
  );

  #handleKeyboardEvent = this.__withContext(
    (sourceEvent: globalThis.KeyboardEvent) => {
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
    }
  );

  #handleFocusEvent = this.__withContext(
    (sourceEvent: globalThis.FocusEvent) => {
      let event: Event;
      switch (sourceEvent.type) {
        case "blur":
          event = new Event(Event.DEACTIVATE, true, false);
          break;
        default:
          return;
      }
      this.dispatchEvent(event);
    }
  );

  __ensureDisplayList() {
    if (!this.__displayListDirty) {
      return;
    }

    this.__displayList.length = 1;
    this.__displayList[0] = this;

    let i = 0;
    while (i < this.__displayList.length) {
      const children = this.__displayList[i].__node.children;
      for (let j = 0; j < children.length; j++) {
        this.__displayList.push(children[j].object as DisplayObject);
      }
      i++;
    }

    this.__displayListDirty = false;
  }
}
