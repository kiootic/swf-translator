import { DisplayObject } from "./DisplayObject";
import { InteractiveObject } from "./InteractiveObject";
import {
  ButtonInstance,
  ButtonState,
} from "../../../internal/character/ButtonInstance";
import { MouseEvent } from "../events";
import { SoundContext } from "../media/context";

export class SimpleButton extends InteractiveObject {
  static __character?: ButtonInstance;

  declare __character: ButtonInstance | null;

  constructor() {
    super();

    this.__state = ButtonState.Up;
    this.__states = [
      new DisplayObject(),
      new DisplayObject(),
      new DisplayObject(),
      new DisplayObject(),
    ];

    for (const obj of this.__states) {
      obj.__node.setParent(this.__node, this.__node.children.length);
    }

    this.__character =
      (this.constructor as typeof SimpleButton).__character ?? null;
    this.__character?.applyTo(this);
    this.__node.buttonState = this.__state;

    this.addEventListener(MouseEvent.MOUSE_OVER, this.__handleMouseEvent);
    this.addEventListener(MouseEvent.MOUSE_OUT, this.__handleMouseEvent);
    this.addEventListener(MouseEvent.MOUSE_DOWN, this.__handleMouseEvent);
    this.addEventListener(MouseEvent.MOUSE_UP, this.__handleMouseEvent);
    this.addEventListener(MouseEvent.MOUSE_MOVE, this.__handleMouseEvent);
  }

  readonly __soundContext = new SoundContext();
  private __state = ButtonState.Up;
  private __states: DisplayObject[];

  get __activeState() {
    switch (this.__state) {
      case ButtonState.Up:
        return this.upState;
      case ButtonState.Over:
        return this.overState;
      case ButtonState.Down:
        return this.downState;
    }
  }

  get upState() {
    return this.__states[ButtonState.Up];
  }
  set upState(value) {
    this.__states[ButtonState.Up].__node.setParent(null, 0);
    this.__states[ButtonState.Up] = value;
    value.__node.setParent(this.__node, ButtonState.Up);
  }

  get overState() {
    return this.__states[ButtonState.Over];
  }
  set overState(value) {
    this.__states[ButtonState.Over].__node.setParent(null, 0);
    this.__states[ButtonState.Over] = value;
    value.__node.setParent(this.__node, ButtonState.Over);
  }

  get downState() {
    return this.__states[ButtonState.Down];
  }
  set downState(value) {
    this.__states[ButtonState.Down].__node.setParent(null, 0);
    this.__states[ButtonState.Down] = value;
    value.__node.setParent(this.__node, ButtonState.Down);
  }

  get hitTestState() {
    return this.__states[ButtonState.HitTest];
  }
  set hitTestState(value) {
    this.__states[ButtonState.HitTest].__node.setParent(null, 0);
    this.__states[ButtonState.HitTest] = value;
    value.__node.setParent(this.__node, ButtonState.HitTest);
  }

  trackAsMenu = false;

  useHandCursor = true;

  get __isPointerCursor() {
    return this.useHandCursor || super.__isPointerCursor;
  }

  private __handleMouseEvent = (event: MouseEvent) => {
    let newState: ButtonState = this.__state;
    let isMouseDown = event.type !== MouseEvent.MOUSE_OUT && event.buttonDown;
    if (event.type === MouseEvent.MOUSE_OUT) {
      newState = ButtonState.Up;
    } else if (
      event.buttonDown &&
      this.hitTestPoint(event.stageX, event.stageY)
    ) {
      newState = ButtonState.Down;
    } else {
      newState = ButtonState.Over;
    }

    const stage = this.stage;

    if (this.__state !== newState) {
      const oldState = this.__state;
      this.__state = newState;
      this.__node.buttonState = newState;
      this.__character?.instantiateState(this, newState);
      this.__character?.stateTransition(this, oldState, newState);
      if (stage) {
        stage.__displayListDirty = true;
      }
    }

    if (!this.trackAsMenu && stage) {
      if (isMouseDown) {
        stage.__mouseTrackTarget = this;
      } else if (stage.__mouseTrackTarget === this) {
        stage.__mouseTrackTarget = null;
      }
    }
  };
}
