import { observable, runInAction, createAtom } from "mobx";
import { mat2d, vec4, mat3 } from "gl-matrix";
import { CharacterInstance } from "../../../internal/character/CharacterInstance";
import { RenderObject } from "../../../internal/render/RenderObject";
import { RenderContext } from "../../../internal/render/RenderContext";
import { RenderTarget } from "../../../internal/render/RenderTarget";
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

  #needReRender = false;
  #renderTarget: RenderTarget | null = null;

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

  @observable
  cacheAsBitmap: boolean = false;

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

    const [x, y, width, height] = this.#bounds.__rect;
    if (this.cacheAsBitmap && width > 0 && height > 0) {
      let target = this.#renderTarget;
      if (!target) {
        target = new RenderTarget();
        this.#renderTarget = target;
        this.#needReRender = true;
      }
      if (target.resize(ctx.gl, width, height)) {
        this.#needReRender = true;
      }

      if (this.#needReRender) {
        ctx.renderer.renderToTarget(target, this.#bounds.__rect, (ctx) => {
          this.__doRender(ctx);
        });
        this.#needReRender = false;
      }

      mat2d.translate(
        target.renderMatrix,
        this.transform.__worldMatrix.__value,
        [x, y]
      );
      vec4.copy(target.colorMul, this.transform.__worldColorTransform.__mul);
      vec4.copy(target.colorAdd, this.transform.__worldColorTransform.__add);
      target.renderTo(ctx);

      return;
    } else if (this.#renderTarget) {
      this.#renderTarget.delete(ctx.gl);
      this.#renderTarget = null;
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

  __reportDirty() {
    runInAction(() => {
      let obj: DisplayObject | null = this.parent;
      while (obj) {
        if (obj.cacheAsBitmap) {
          obj.#needReRender = true;
          break;
        }
        obj = obj.parent;
      }
    });
  }
}
