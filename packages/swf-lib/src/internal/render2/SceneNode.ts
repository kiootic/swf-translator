import { mat2d, vec2, vec4 } from "gl-matrix";
import { RenderObject } from "./RenderObject";
import { rect } from "../math/rect";
import { FilterInstance } from "./filter/Filter";
import { RenderContext } from "./RenderContext";
import { Texture } from "./gl/Texture";
import { CachedRender } from "./CachedRender";

const enum Flags {
  DirtyBounds = 1,
  DirtyTransform = 2,
  DirtyRender = 4, // FIXME: apply this flag correctly

  DirtyAll = 7,
}

const tmpRect = rect.create();
const tmpVec2 = vec2.create();

export class SceneNode {
  flags: number = Flags.DirtyAll;

  parent: SceneNode | null = null;
  mask: SceneNode | null = null;
  children: SceneNode[] = [];

  visible = true;
  buttonState = -1;
  renderObjects: RenderObject[] = [];
  readonly boundsIntrinsic = rect.create();

  cacheAsBitmap = false;
  cachedRender: CachedRender | null = null;
  filters: FilterInstance[] = [];

  readonly transformLocal = mat2d.identity(mat2d.create());
  readonly colorTransformLocalMul = vec4.fromValues(1, 1, 1, 1);
  readonly colorTransformLocalAdd = vec4.fromValues(0, 0, 0, 0);

  readonly boundsLocal = rect.create();
  readonly boundsWorld = rect.create();
  readonly transformWorld = mat2d.identity(mat2d.create());
  readonly transformWorldInvert = mat2d.identity(mat2d.create());

  markRenderDirty() {
    let node: SceneNode | null = this;
    while (node) {
      if ((node.flags & Flags.DirtyRender) !== 0) {
        break;
      }
      node.flags |= Flags.DirtyRender;
      node = node.parent;
    }
  }

  markBoundsDirty() {
    let node: SceneNode | null = this;
    while (node) {
      if ((node.flags & Flags.DirtyBounds) !== 0) {
        break;
      }
      node.flags |= Flags.DirtyBounds;
      node = node.parent;
    }
  }

  markTransformDirty() {
    this.parent?.markBoundsDirty();

    const nodes: SceneNode[] = [this];
    let node: SceneNode | undefined;
    while ((node = nodes.pop())) {
      if ((node.flags & Flags.DirtyTransform) !== 0) {
        continue;
      }

      node.flags |= Flags.DirtyTransform;
      for (const child of node.children) {
        nodes.push(child);
      }
    }
  }

  ensureLocalBounds() {
    if ((this.flags & Flags.DirtyBounds) === 0) {
      return;
    }

    const newBounds = rect.create();
    rect.copy(newBounds, this.boundsIntrinsic);
    for (const child of this.children) {
      child.ensureLocalBounds();
      rect.apply(tmpRect, child.boundsLocal, child.transformLocal);
      rect.union(newBounds, newBounds, tmpRect);
    }
    if (!rect.equals(this.boundsLocal, newBounds)) {
      this.flags |= Flags.DirtyRender;
    }
    rect.copy(this.boundsLocal, newBounds);

    this.flags &= ~Flags.DirtyBounds;
  }

  ensureWorldTransform() {
    if ((this.flags & Flags.DirtyTransform) === 0) {
      return;
    }

    let node: SceneNode = this;
    while (node.parent && (node.parent.flags & Flags.DirtyTransform) !== 0) {
      node = node.parent;
    }
    node.updateWorldTransform();
  }

  updateWorldTransform() {
    const nodes: SceneNode[] = [this];
    let node: SceneNode | undefined;
    while ((node = nodes.pop())) {
      if (!node.parent) {
        mat2d.copy(node.transformWorld, node.transformLocal);
      } else {
        mat2d.multiply(
          node.transformWorld,
          node.parent.transformWorld,
          node.transformLocal
        );
      }
      mat2d.invert(node.transformWorldInvert, node.transformWorld);
      node.ensureLocalBounds();
      rect.apply(node.boundsWorld, node.boundsLocal, node.transformWorld);

      node.flags &= ~Flags.DirtyTransform;
      nodes.push(...node.children);
    }
  }

  setParent(parent: SceneNode | null, index: number) {
    if (this.parent === parent) {
      if (parent) {
        const i = parent.children.indexOf(this);
        parent.children.splice(i, 1);
        parent.children.splice(index, 0, this);
        parent.markRenderDirty();
      }
      return;
    }

    if (this.parent) {
      const i = this.parent.children.indexOf(this);
      this.parent.children.splice(i, 1);
      this.parent.markBoundsDirty();
    }

    this.parent = parent;

    if (this.parent) {
      this.parent.children.splice(index, 0, this);
      this.parent.markBoundsDirty();
    }

    this.markTransformDirty();
  }

  setRenderObjects(objects: RenderObject[], intrinsicBounds: rect) {
    this.renderObjects = objects;

    rect.copy(this.boundsIntrinsic, intrinsicBounds);
    this.markBoundsDirty();
  }

  render(ctx: RenderContext) {
    this.ensureLocalBounds();
    this.renderRecursive(ctx);
  }

  private renderRecursive(ctx: RenderContext) {
    ctx.pushTransform(
      this.transformLocal,
      this.colorTransformLocalMul,
      this.colorTransformLocalAdd
    );

    this.doRender(ctx);

    ctx.popTransform();
  }

  private doRender(ctx: RenderContext) {
    if (!this.visible) {
      return;
    }

    rect.apply(tmpRect, this.boundsLocal, ctx.transform.view);
    if (ctx.viewport && !rect.intersects(tmpRect, ctx.viewport)) {
      return;
    }

    if (
      this.cacheAsBitmap &&
      this.cachedRender &&
      (this.flags & Flags.DirtyRender) === 0
    ) {
      ctx.renderObject(this.cachedRender.renderObject);
      return;
    }

    this.flags &= ~Flags.DirtyRender;

    this.cachedRender?.return();
    this.cachedRender = null;

    if (this.cacheAsBitmap || this.filters.length > 0) {
      const paddings = vec2.create();
      for (const filter of this.filters) {
        vec2.max(paddings, paddings, filter.paddings);
      }
      vec2.ceil(paddings, paddings);

      const filters = this.filters.slice();
      const onRenderTexture = (
        ctx: RenderContext,
        tex: Texture,
        bounds: rect
      ) => {
        const nextFilter = filters.shift();
        if (nextFilter) {
          ctx.renderFilter(tex, bounds, nextFilter, onRenderTexture);
          return;
        }

        if (this.cacheAsBitmap) {
          ctx.renderCache(tex, bounds, (ctx, render) => {
            this.cachedRender = render;
            ctx.renderObject(this.cachedRender.renderObject);
          });
        } else {
          ctx.renderObject(RenderObject.rect(bounds, tex));
        }
      };

      ctx.renderTexture(
        this.boundsLocal,
        paddings,
        (ctx) => this.doRenderContent(ctx),
        onRenderTexture
      );
    } else {
      this.doRenderContent(ctx);
    }
  }

  private doRenderContent(ctx: RenderContext) {
    for (const o of this.renderObjects) {
      ctx.renderObject(o);
    }

    if (this.buttonState >= 0) {
      this.children[this.buttonState].render(ctx);
    } else {
      for (const child of this.children) {
        child.renderRecursive(ctx);
      }
    }
  }

  hitTest(pt: vec2, exact: boolean): boolean {
    if (this.buttonState >= 0) {
      return this.children[3].hitTest(pt, true);
    }

    if (!exact) {
      this.ensureLocalBounds();
      vec2.transformMat2d(tmpVec2, pt, this.transformWorldInvert);
      return rect.contains(this.boundsLocal, tmpVec2[0], tmpVec2[1]);
    }

    const nodes: SceneNode[] = [this];
    let node: SceneNode | undefined;
    while ((node = nodes.pop())) {
      if (node.renderObjects.length > 0) {
        vec2.transformMat2d(tmpVec2, pt, node.transformWorldInvert);
        if (
          node.renderObjects.some((obj) =>
            obj.hitTest(tmpVec2[0], tmpVec2[1], exact)
          )
        ) {
          return true;
        }
      }

      for (const child of node.children) {
        nodes.push(child);
      }
    }
    return false;
  }
}
