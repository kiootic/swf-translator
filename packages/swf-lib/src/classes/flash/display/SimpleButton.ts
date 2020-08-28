import { autorun, observable, computed, reaction, runInAction } from "mobx";
import { DisplayObject } from "./DisplayObject";
import { InteractiveObject } from "./InteractiveObject";
import { Transform } from "../geom/Transform";
import {
  ButtonInstance,
  ButtonState,
} from "../../../internal/character/ButtonInstance";
import { rect } from "../../../internal/math/rect";
import { RenderContext } from "../../../internal/render/RenderContext";
import { MouseEvent } from "../events";

export class SimpleButton extends InteractiveObject {
  static __character?: ButtonInstance;

  declare __character: ButtonInstance | null;

  constructor() {
    super();

    this.__character =
      (this.constructor as typeof SimpleButton).__character ?? null;
    this.__character?.applyTo(this);

    this.addEventListener(MouseEvent.MOUSE_OVER, this.#handleMouseEvent);
    this.addEventListener(MouseEvent.MOUSE_OUT, this.#handleMouseEvent);
    this.addEventListener(MouseEvent.MOUSE_DOWN, this.#handleMouseEvent);
    this.addEventListener(MouseEvent.MOUSE_UP, this.#handleMouseEvent);
    this.addEventListener(MouseEvent.MOUSE_MOVE, this.#handleMouseEvent);
  }

  @observable
  __state = ButtonState.Up;

  @computed
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

  @observable
  upState = new DisplayObject();

  @observable
  overState = new DisplayObject();

  @observable
  downState = new DisplayObject();

  @observable
  hitTestState = new DisplayObject();

  @observable
  trackAsMenu = false;

  @observable
  useHandCursor = true;

  get __cursor() {
    return this.useHandCursor ? "pointer" : "default";
  }

  __onFrameEnter() {
    this.__activeState?.__onFrameEnter();
    this.hitTestState.__onFrameEnter();
  }

  __onFrameConstruct() {
    this.__activeState?.__onFrameConstruct();
    this.hitTestState.__onFrameConstruct();
  }

  __onFrameExit() {
    this.__activeState?.__onFrameExit();
    this.hitTestState.__onFrameExit();
  }

  __doRender(ctx: RenderContext) {
    super.__doRender(ctx);
    this.__activeState?.__render(ctx);
  }

  hitTestPoint(x: number, y: number): boolean {
    return this.hitTestState.hitTestPoint(x, y, true);
  }

  #activateState = reaction(
    () => this.__state,
    (state) => {
      if (!this.__character) {
        return;
      }
      this.__character.instantiateState(this, state);
    }
  );

  #updateStateTransform = autorun(() => {
    let transform = this.transform;
    if (this.cacheAsBitmap) {
      transform = new Transform();
    }
    if (this.upState.transform.__update(transform)) {
      this.upState.__reportDirty();
    }
    if (this.overState.transform.__update(transform)) {
      this.overState.__reportDirty();
    }
    if (this.downState.transform.__update(transform)) {
      this.downState.__reportDirty();
    }
    this.hitTestState.transform.__update(this.transform);
  });

  #copyBounds = autorun(() => {
    let bounds = this.__activeState?.__bounds.__rect ?? this.__bounds.__rect;

    const changed = !rect.equals(bounds, this.__bounds.__rect);
    rect.copy(this.__bounds.__rect, bounds);
    if (changed) {
      this.__reportBoundsChanged();
    }
  });

  #handleMouseEvent = (event: MouseEvent) => {
    let newState: ButtonState = this.__state;
    let isMouseDown = event.type !== MouseEvent.MOUSE_OUT && event.buttonDown;
    if (event.type === MouseEvent.MOUSE_OUT) {
      newState = ButtonState.Up;
    } else if (
      event.buttonDown &&
      this.hitTestPoint(event.localX, event.localY)
    ) {
      newState = ButtonState.Down;
    } else {
      newState = ButtonState.Over;
    }

    runInAction(() => (this.__state = newState));

    const stage = this.stage;
    if (!this.trackAsMenu && stage) {
      if (isMouseDown) {
        stage.__mouseTrackTarget = this;
      } else if (stage.__mouseTrackTarget === this) {
        stage.__mouseTrackTarget = null;
      }
    }
  };
}
