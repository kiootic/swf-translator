import { action, autorun, observable } from "mobx";
import { DisplayObject } from "./DisplayObject";
import { InteractiveObject } from "./InteractiveObject";
import { Transform } from "../geom";
import { RenderContext } from "../../../internal/render/RenderContext";
import { rect } from "../../../internal/math/rect";
import { vec2 } from "gl-matrix";

export class DisplayObjectContainer extends InteractiveObject {
  #children: DisplayObject[] = [];

  @observable
  __children: DisplayObject[] = [];

  get numChildren(): number {
    return this.__children.length;
  }

  @action
  addChild(child: DisplayObject) {
    child.parent?.removeChild(child);

    this.__children.push(child);
    child.parent = this;
    return child;
  }

  @action
  addChildAt(child: DisplayObject, index: number) {
    child.parent?.removeChild(child);

    this.__children.splice(index, 0, child);
    child.parent = this;
    return child;
  }

  @action
  getChildAt(index: number) {
    return this.__children[index] ?? null;
  }

  @action
  removeChild(child: DisplayObject) {
    const i = this.__children.indexOf(child);
    if (i < 0) {
      return null;
    }
    this.__children.splice(i, 1);
    child.parent = null;
    return child;
  }

  @action
  removeChildAt(index: number) {
    const child = this.__children.splice(index, 1)[0] ?? null;
    if (child) {
      child.parent = null;
    }
    return child;
  }

  @action
  removeChildren(beginIndex = 0, endIndex = this.__children.length) {
    const removedChildren = this.__children.splice(
      beginIndex,
      endIndex - beginIndex
    );
    for (const child of removedChildren) {
      child.parent = null;
    }
  }

  contains(child: DisplayObject) {
    return this.__children.includes(child);
  }

  hitTestPoint(x: number, y: number, shapeFlag?: boolean) {
    if (!shapeFlag) {
      return super.hitTestPoint(x, y, shapeFlag);
    }

    const v = vec2.create();
    for (const child of this.#children) {
      vec2.transformMat2d(v, [x, y], child.transform.__matrixInverted);
      if (child.hitTestPoint(v[0], v[1], shapeFlag)) {
        return true;
      }
    }
    return false;
  }

  __onFrameEnter() {
    for (const child of this.__children) {
      child.__onFrameEnter();
    }
    super.__onFrameEnter();
  }

  __onFrameConstruct() {
    for (const child of this.__children) {
      child.__onFrameConstruct();
    }
    super.__onFrameConstruct();
  }

  __onFrameExit() {
    for (const child of this.__children) {
      child.__onFrameExit();
    }
    super.__onFrameExit();
  }

  __doRender(ctx: RenderContext) {
    super.__doRender(ctx);

    interface Stencil {
      endDepth: number;
      end: () => void;
    }
    const stencils: Stencil[] = [];
    for (const child of this.#children) {
      while (
        stencils.length > 0 &&
        child.__depth > stencils[stencils.length - 1].endDepth
      ) {
        stencils.pop()!.end();
      }

      if (child.__clipDepth !== -1) {
        const endStencil = ctx.stencil(() => {
          child.__render(ctx);
        });
        stencils.push({ endDepth: child.__clipDepth, end: endStencil });
      } else {
        child.__render(ctx);
      }
    }

    while (stencils.length > 0) {
      stencils.pop()!.end();
    }
  }

  #copyChildren = autorun(() => {
    this.#children = this.__children.slice();
  });

  #computeChildrenTransform = autorun(() => {
    if (this.__children.length === 0) {
      return;
    }

    let transform = this.transform;
    if (this.cacheAsBitmap) {
      transform = new Transform();
    }
    for (const child of this.__children) {
      const isChildDirty = child.transform.__update(transform);
      if (isChildDirty) {
        child.__reportDirty();
      }
    }
  });

  #computeBounds = autorun(() => {
    if (this.__children.length === 0) {
      rect.clear(this.__bounds.__rect);
      return;
    }

    const newBounds = rect.create();
    const childBounds = rect.create();
    for (const child of this.__children) {
      rect.copy(childBounds, child.__bounds.__rect);
      rect.apply(childBounds, childBounds, child.transform.matrix.__value);
      rect.union(newBounds, newBounds, childBounds);
    }
    if (this.cacheAsBitmap) {
      newBounds[0] = Math.floor(newBounds[0]);
      newBounds[1] = Math.floor(newBounds[1]);
      newBounds[2] += 1;
      newBounds[3] += 1;
    }
    const changed = !rect.equals(newBounds, this.__bounds.__rect);
    rect.copy(this.__bounds.__rect, newBounds);
    if (changed) {
      this.__reportBoundsChanged();
    }
  });
}
