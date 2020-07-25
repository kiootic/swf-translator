import { autorun, observable, runInAction, createAtom } from "mobx";
import { CharacterInstance } from "../../../internal/character/CharacterInstance";
import { RenderObject } from "../../../internal/render/RenderObject";
import { RenderContext } from "../../../internal/render/RenderContext";
import type { DisplayObjectContainer } from "./DisplayObjectContainer";
import { EventDispatcher } from "../events/EventDispatcher";
import { Transform } from "../geom/Transform";
import { Rectangle } from "../geom/Rectangle";

export class DisplayObject extends EventDispatcher {
  __character: CharacterInstance | null = null;
  __depth: number = -1;
  readonly __renderObjects: RenderObject[] = [];

  #bounds = new Rectangle();
  #boundsAtom = createAtom("bounds");

  constructor() {
    super();
    this.transform = new Transform();
  }

  readonly transform: Transform;

  get __bounds() {
    this.#boundsAtom.reportObserved();
    return this.#bounds;
  }
  set __bounds(value) {
    this.#bounds = value;
    this.#boundsAtom.reportChanged();
  }

  name: string = "";

  @observable
  visible = true;

  @observable
  parent: DisplayObjectContainer | null = null;

  get x(): number {
    return this.transform.matrix.tx;
  }
  set x(value: number) {
    runInAction(() => {
      this.transform.matrix.tx = value;
      this.transform.__reportMatrixUpdated();
    });
  }

  get y(): number {
    return this.transform.matrix.ty;
  }
  set y(value: number) {
    runInAction(() => {
      this.transform.matrix.ty = value;
      this.transform.__reportMatrixUpdated();
    });
  }

  get width(): number {
    return this.__bounds.__rect[2] * this.transform.matrix.a;
  }
  set width(value: number) {
    runInAction(() => {
      this.transform.matrix.a =
        this.__bounds.__rect[2] === 0 ? 1 : value / this.__bounds.__rect[2];
      this.transform.__reportMatrixUpdated();
    });
  }

  get height(): number {
    return this.__bounds.__rect[3] * this.transform.matrix.d;
  }
  set height(value: number) {
    runInAction(() => {
      this.transform.matrix.d =
        this.__bounds.__rect[3] === 0 ? 1 : value / this.__bounds.__rect[3];
      this.transform.__reportMatrixUpdated();
    });
  }

  __onNewFrame() {}

  __render(ctx: RenderContext) {
    if (!this.visible) {
      return;
    }
    this.__doRender(ctx);
  }

  __doRender(ctx: RenderContext) {
    for (const o of this.__renderObjects) {
      ctx.render(o);
    }
  }

  __reportBoundsChanged() {
    this.#boundsAtom.reportChanged();
  }

  #computeTransform = autorun(() => {
    if (!this.parent) {
      return;
    }

    this.transform.__update(this.parent.transform);
  });
}
