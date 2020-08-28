import {
  observable,
  runInAction,
  createAtom,
  autorun,
  reaction,
  computed,
} from "mobx";
import { mat2d, vec4, mat3, vec2 } from "gl-matrix";
import { CharacterInstance } from "../../../internal/character/CharacterInstance";
import { RenderObject } from "../../../internal/render/RenderObject";
import { RenderContext } from "../../../internal/render/RenderContext";
import { RenderTarget } from "../../../internal/render/RenderTarget";
import { rect } from "../../../internal/math/rect";
import type { DisplayObjectContainer } from "./DisplayObjectContainer";
import type { Stage } from "./Stage";
import { EventDispatcher } from "../events/EventDispatcher";
import { Event } from "../events/Event";
import { Transform } from "../geom/Transform";
import { Rectangle } from "../geom/Rectangle";
import { Point } from "../geom/Point";
import { BitmapFilter } from "../filters/BitmapFilter";

const tmpBounds = rect.create();

export class DisplayObject extends EventDispatcher {
  __character: CharacterInstance | null = null;
  __depth: number = -1;
  __clipDepth: number = -1;
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

  @computed
  get stage(): Stage | null {
    return this.parent?.stage ?? null;
  }

  @observable
  __cacheAsBitmap: boolean = false;

  @observable
  filters: BitmapFilter[] = [];

  get cacheAsBitmap() {
    return this.__cacheAsBitmap || this.filters.length > 0;
  }
  set cacheAsBitmap(value) {
    this.__cacheAsBitmap = value;
  }

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

  get scaleX(): number {
    return this.transform.matrix.a;
  }
  set scaleX(value: number) {
    runInAction(() => {
      this.transform.matrix.a = value;
      this.transform.__reportMatrixUpdated();
    });
  }

  get scaleY(): number {
    return this.transform.matrix.d;
  }
  set scaleY(value: number) {
    runInAction(() => {
      this.transform.matrix.d = value;
      this.transform.__reportMatrixUpdated();
    });
  }

  get rotation(): number {
    const angle = Math.atan2(this.transform.matrix.b, this.transform.matrix.d);
    return (angle * 180) / Math.PI;
  }
  set rotation(value: number) {
    runInAction(() => {
      const rotation = this.rotation;
      const delta = ((value - rotation) / 180) * Math.PI;
      mat2d.rotate(
        this.transform.matrix.__value,
        this.transform.matrix.__value,
        delta
      );
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

  get mouseX(): number {
    const stage = this.stage;
    if (!stage) {
      return 0;
    }
    return this.globalToLocal(
      new Point(stage.__mousePosition[0], stage.__mousePosition[1])
    ).x;
  }

  get mouseY(): number {
    const stage = this.stage;
    if (!stage) {
      return 0;
    }
    return this.globalToLocal(
      new Point(stage.__mousePosition[0], stage.__mousePosition[1])
    ).y;
  }

  globalToLocal(point: Point, __out?: Point): Point {
    const local = __out ?? new Point();
    vec2.transformMat2d(
      local.__value,
      point.__value,
      this.transform.__worldMatrixInverted
    );
    return local;
  }

  hitTestPoint(x: number, y: number, shapeFlag = false): boolean {
    return rect.contains(this.__bounds.__rect, x, y);
  }

  hitTestObject(obj: DisplayObject): boolean {
    return rect.intersects(this.__bounds.__rect, obj.__bounds.__rect);
  }

  __onNewFrame() {
    this.dispatchEvent(new Event(Event.ENTER_FRAME, false));
  }

  __render(ctx: RenderContext) {
    rect.apply(
      tmpBounds,
      this.#bounds.__rect,
      this.transform.__worldMatrix.__value
    );

    if (!this.visible || !rect.intersects(tmpBounds, ctx.bounds)) {
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

      let padX = 4,
        padY = 4;
      for (const filter of this.filters) {
        padX = Math.max(padX, filter.__padX);
        padY = Math.max(padY, filter.__padY);
      }
      const scaleX = Math.abs(this.transform.__worldMatrix.a);
      const scaleY = Math.abs(this.transform.__worldMatrix.d);
      if (
        target.resize(ctx.gl, this.#bounds.__rect, padX, padY, scaleX, scaleY)
      ) {
        this.#needReRender = true;
      }

      if (this.#needReRender) {
        ctx.renderer.renderToTarget(target, (ctx) => {
          this.__doRender(ctx);
        });
        for (const filter of this.filters) {
          filter.__apply(target, ctx);
        }
        this.#needReRender = false;
      }

      mat2d.translate(
        target.renderMatrix,
        this.transform.__worldMatrix.__value,
        [x, y]
      );
      target.renderMatrix[4] = Math.floor(target.renderMatrix[4]);
      target.renderMatrix[5] = Math.floor(target.renderMatrix[5]);
      vec4.copy(target.colorMul, this.transform.__worldColorTransform.__mul);
      vec4.copy(target.colorAdd, this.transform.__worldColorTransform.__add);
      target.renderTo(ctx);

      return;
    } else if (this.#renderTarget) {
      this.#renderTarget.delete();
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

  __filterMarkReRender = reaction(
    () => this.filters,
    () => {
      if (this.cacheAsBitmap) {
        this.#needReRender = true;
      }
    }
  );

  __cleanupRenderTarget = autorun(() => {
    if (!this.parent) {
      if (this.#renderTarget) {
        this.#renderTarget.delete();
        this.#renderTarget = null;
      }
    }
  });

  __copyParent = autorun(() => {
    this.__setEventParent(this.parent);
  });
}
