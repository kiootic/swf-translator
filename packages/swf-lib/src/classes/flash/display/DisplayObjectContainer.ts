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
    for (const child of this.#children) {
      child.__render(ctx);
    }
  }

  #copyChildren = autorun(() => {
    this.#children = this.__children.slice();
  });

  #computeChildrenTransform = autorun(() => {
    if (this.__children.length === 0) {
      return;
    }

    const cacheAsBitmap = this.cacheAsBitmap;
    for (const child of this.__children) {
      const isChildDirty = child.transform.__update(
        cacheAsBitmap ? Transform.__empty : this.transform
      );
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
