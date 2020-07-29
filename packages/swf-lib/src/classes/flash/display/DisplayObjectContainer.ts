import { action, autorun, observable } from "mobx";
import { DisplayObject } from "./DisplayObject";
import { InteractiveObject } from "./InteractiveObject";
import { Transform } from "../geom";
import { RenderContext } from "../../../internal/render/RenderContext";
import { rect } from "../../../internal/math/rect";

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

  __onNewFrame() {
    for (const child of this.__children) {
      child.__onNewFrame();
    }
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
      const { tx, ty } = this.transform.__worldMatrix;
      transform.__worldMatrix.tx = tx - Math.floor(tx);
      transform.__worldMatrix.ty = ty - Math.floor(ty);
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
    const changed = !rect.equals(newBounds, this.__bounds.__rect);
    rect.copy(this.__bounds.__rect, newBounds);
    if (changed) {
      this.__reportBoundsChanged();
    }
  });
}
