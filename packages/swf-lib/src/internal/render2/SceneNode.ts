import { mat2d, vec2, vec4 } from "gl-matrix";
import { RenderObject } from "./RenderObject";
import { rect } from "../math/rect";
import { FilterInstance } from "./filter/Filter";
import { RenderContext } from "./RenderContext";
import { Texture } from "./gl/Texture";

const enum Flags {
  DirtyBounds = 1,
  DirtyTransform = 2,
  DirtyRender = 4,

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

  ensureLocalBounds() {
    if ((this.flags & Flags.DirtyBounds) === 0) {
      return;
    }

    rect.copy(this.boundsLocal, this.boundsIntrinsic);
    for (const child of this.children) {
      child.ensureLocalBounds();
      rect.apply(tmpRect, child.boundsLocal, child.transformLocal);
      rect.union(this.boundsLocal, this.boundsLocal, tmpRect);
    }

    this.flags &= ~Flags.DirtyBounds;
  }

  markTransformDirty() {
    this.parent?.markBoundsDirty();
    this.flags |= Flags.DirtyTransform;
    this.markRenderDirty();
  }

  ensureWorldTransform() {
    let node: SceneNode | null = this;
    while (node && (node.flags & Flags.DirtyTransform) === 0) {
      node = node.parent;
    }
    if (!node) {
      return;
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
      }
      this.markRenderDirty();
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
    this.markRenderDirty();
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

    rect.apply(tmpRect, this.boundsLocal, ctx.transform.view);
    if (this.visible && rect.intersects(tmpRect, ctx.bounds)) {
      this.flags &= ~Flags.DirtyRender;

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

          ctx.renderObject(RenderObject.rect(bounds, tex));
        };

        ctx.renderTexture(
          this.boundsLocal,
          paddings,
          (ctx) => this.doRender(ctx),
          onRenderTexture
        );
      } else {
        this.doRender(ctx);
      }
    }

    ctx.popTransform();
  }

  private doRender(ctx: RenderContext) {
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
