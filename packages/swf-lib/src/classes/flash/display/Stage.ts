import { vec2 } from "gl-matrix";
import { DisplayObject } from "./DisplayObject";
import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { InteractiveObject } from "./InteractiveObject";
import { Properties } from "../../__internal/Properties";
import { Canvas } from "../../../internal/render2/Canvas";
import { Renderer } from "../../../internal/render2/Renderer";
import { Ticker } from "../../../internal/Ticker";
import { AudioController } from "../../../internal/audio";
import { Event } from "../events/Event";
import { EventDispatcher } from "../events/EventDispatcher";
import { MouseEvent } from "../events/MouseEvent";
import { KeyboardEvent } from "../events/KeyboardEvent";
import { Keyboard } from "../ui/Keyboard";
import { runFrame } from "./frame";

const tmpVec2 = vec2.create();

interface Constructible {
  __constructFrame(): void;
}

interface Initializable {
  __initFrame(stage: Stage, isRoot: boolean): void;
}

export class Stage extends DisplayObjectContainer {
  static __current: Stage | null = null;

  readonly __canvas: Canvas;
  readonly __ticker: Ticker;
  readonly __renderer: Renderer;
  readonly __audio = new AudioController();

  __displayListDirty = false;
  readonly __displayList: DisplayObject[] = [];
  readonly __initQueue: Initializable[] = [];
  readonly __constructionQueue: Constructible[] = [];

  __mousePosition = vec2.create();
  __mouseOn: InteractiveObject | null = null;
  __mouseTrackTarget: InteractiveObject | null = null;

  focus: InteractiveObject | null = null;
  private __quality: string = "HIGH";

  private __isDisposed = false;
  private __isActiveValue = true;

  get __isActive() {
    return this.__isActiveValue;
  }
  set __isActive(value) {
    if (this.__isDisposed) {
      throw new Error("Stage is disposed");
    } else if (this.__isActiveValue === value) {
      return;
    }
    this.__isActiveValue = value;

    if (value) {
      this.__audio.context.resume();
    } else {
      this.__audio.context.suspend();
    }
    this.__updateCursor();
  }

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

  get quality() {
    return this.__quality;
  }
  set quality(value) {
    if (this.__quality === value) {
      return;
    }
    this.__quality = value;
    if (this.__quality === "HIGH") {
      this.__renderer.glState.sampleLimit = 4;
    } else {
      this.__renderer.glState.sampleLimit = 0;
    }
    this.__renderer.glState.resetRenderState();

    // Re-render after resetting render state
    this.__onRender();
    this.__renderer.renderFrame(this.__node);
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
    canvas.addEventListener("mouseenter", this.__handleMouseEvent);
    canvas.addEventListener("mousemove", this.__handleMouseEvent);
    canvas.addEventListener("mousedown", this.__handleMouseEvent);
    canvas.addEventListener("mouseup", this.__handleMouseEvent);
    canvas.addEventListener("mouseleave", this.__handleMouseEvent);
    canvas.addEventListener("click", this.__handleMouseEvent);
    canvas.addEventListener("keydown", this.__handleKeyboardEvent);
    canvas.addEventListener("keyup", this.__handleKeyboardEvent);
    canvas.addEventListener("blur", this.__handleFocusEvent);
  }

  __onFrame = this.__withContext(() => {
    if (!this.__isActiveValue) {
      return;
    }
    runFrame(true, this);
    this.__updateCursor();
  });

  __doRender = this.__withContext(() => {
    if (!this.__isActiveValue) {
      return;
    }
    this.__onRender();
    this.__renderer.renderFrame(this.__node);
    this.__renderer.blitFrame();
  });

  __withContext<T extends Function>(fn: T): T {
    return (((...args: unknown[]) => {
      const ps = Stage.__current;
      const pe = EventDispatcher.__eventContext;
      Stage.__current = this;
      EventDispatcher.__eventContext = this;
      try {
        return fn(...args);
      } finally {
        Stage.__current = ps;
        EventDispatcher.__eventContext = pe;
      }
    }) as unknown) as T;
  }

  __dispose() {
    this.__isActive = false;

    this.__audio.context.close();
    this.__renderer.glState.dispose();
    this.__ticker.end();

    const canvas = this.__canvas.element;
    canvas.removeEventListener("mouseenter", this.__handleMouseEvent);
    canvas.removeEventListener("mousemove", this.__handleMouseEvent);
    canvas.removeEventListener("mousedown", this.__handleMouseEvent);
    canvas.removeEventListener("mouseup", this.__handleMouseEvent);
    canvas.removeEventListener("mouseleave", this.__handleMouseEvent);
    canvas.removeEventListener("click", this.__handleMouseEvent);
    canvas.removeEventListener("keydown", this.__handleKeyboardEvent);
    canvas.removeEventListener("keyup", this.__handleKeyboardEvent);
    canvas.removeEventListener("blur", this.__handleFocusEvent);

    this.__isDisposed = true;
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

  __handleMouseEvent = this.__withContext(
    (sourceEvent: globalThis.MouseEvent) => {
      if (!this.__isActiveValue) {
        return;
      }

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
    }
  );

  __updateCursor = () => {
    if (this.__mouseOn && this.__isActiveValue) {
      this.__canvas.cursor = this.__mouseOn.__isPointerCursor
        ? "pointer"
        : "default";
    } else {
      this.__canvas.cursor = "default";
    }
  };

  __handleKeyboardEvent = this.__withContext(
    (sourceEvent: globalThis.KeyboardEvent) => {
      if (!this.__isActiveValue) {
        return;
      }

      const keyCode =
        Keyboard.codeMap[sourceEvent.key] ?? Keyboard.codeMap[sourceEvent.code];
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

  __handleFocusEvent = this.__withContext(
    (sourceEvent: globalThis.FocusEvent) => {
      if (!this.__isActiveValue) {
        return;
      }

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
        if (children[j].object) {
          this.__displayList.push(children[j].object as DisplayObject);
        }
      }
      i++;
    }

    this.__displayListDirty = false;
  }
}
