import { mat2d, vec2, vec4 } from "gl-matrix";
import { RenderObject } from "./RenderObject";
import { rect } from "../math/rect";
import { FilterInstance } from "./filter/Filter";
import { RenderContext } from "./RenderContext";
import { Texture } from "./gl/Texture";
import { CachedRender } from "./CachedRender";
import { pixelToTwips, TWIPS } from "../twips";
import { fpMat, fpRect } from "../fp16";

const enum Flags {
  DirtyBounds = 1,
  DirtyTransform = 2,
  DirtyChildTransform = 4,
  DirtyRender = 8, // FIXME: apply this flag correctly

  DirtyAll = 15,

  IsRoot = 128,
}

const tmpRect1 = rect.create();
const tmpRect2 = rect.create();
const tmpMat2d1 = mat2d.create();
const tmpMat2d2 = mat2d.create();
const tmpVec2 = vec2.create();

export class SceneNode {
  flags: number = Flags.DirtyAll;

  parent: SceneNode | null = null;
  mask: SceneNode | null = null;
  children: SceneNode[] = [];

  visible = true;
  isMask = false;
  buttonState = -1;
  renderObjects: RenderObject[] = [];
  readonly boundsIntrinsic = rect.create();

  cacheAsBitmap = false;
  cachedRender: CachedRender | null = null;
  filters: FilterInstance[] = [];

  readonly transformLocal = mat2d.create();
  readonly colorTransformLocalMul = vec4.fromValues(1, 1, 1, 1);
  readonly colorTransformLocalAdd = vec4.fromValues(0, 0, 0, 0);

  readonly boundsLocal = rect.create();
  readonly boundsWorld = rect.create();
  readonly transformRender = mat2d.create();
  readonly transformWorld = mat2d.create();
  readonly transformWorldInvert = mat2d.create();

  constructor(readonly object: unknown) {}

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

  markLayoutDirty(dirtyTransform = true) {
    // Mark parent bounds dirty.
    let node: SceneNode | null | undefined = this;
    while (node) {
      node.flags |= Flags.DirtyBounds;
      node = node.parent;
    }

    if (!dirtyTransform) {
      return;
    }

    // Mark parent child transform dirty.
    node = this;
    while (node) {
      node.flags |= Flags.DirtyChildTransform;
      node = node.parent;
    }

    // Mark children transform dirty.
    const nodes: SceneNode[] = [this];
    while ((node = nodes.pop())) {
      node.flags |= Flags.DirtyTransform | Flags.DirtyChildTransform;
      for (const child of node.children) {
        nodes.push(child);
      }
    }
  }

  ensureLayout() {
    const queue: SceneNode[] = [this];
    let node: SceneNode | undefined;
    while ((node = queue.pop())) {
      // Ensure parent transform.
      if (node.parent && (node.parent.flags & Flags.DirtyTransform) !== 0) {
        queue.push(node.parent);
        continue;
      }

      // Enqueue children to traverse.
      if (node.flags & Flags.DirtyChildTransform) {
        queue.push(...node.children);
        node.flags &= ~Flags.DirtyChildTransform;
      }

      if ((node.flags & Flags.DirtyTransform) === 0) {
        continue;
      }

      // Compute world/render transform.
      if (!node.parent) {
        mat2d.copy(tmpMat2d1, node.transformLocal);
        mat2d.copy(tmpMat2d2, node.transformLocal);
      } else {
        mat2d.multiply(
          tmpMat2d1,
          node.parent.transformWorld,
          node.transformLocal
        );
        mat2d.multiply(
          tmpMat2d2,
          node.parent.transformRender,
          node.transformLocal
        );
      }
      if (node.cacheAsBitmap) {
        mat2d.identity(tmpMat2d2);
      }
      fpMat(tmpMat2d1);
      fpMat(tmpMat2d2);
      const updated = !mat2d.exactEquals(tmpMat2d1, node.transformWorld);
      const renderDirty = !mat2d.exactEquals(tmpMat2d2, node.transformRender);
      node.flags &= ~Flags.DirtyTransform;

      // Propagate computation.
      if (updated) {
        mat2d.copy(node.transformWorld, tmpMat2d1);
        mat2d.invert(node.transformWorldInvert, node.transformWorld);
        fpMat(node.transformWorldInvert);
        rect.apply(node.boundsWorld, node.boundsLocal, node.transformWorld);
        fpRect(node.boundsWorld);

        let dirtyParent = node.parent;
        while (dirtyParent) {
          dirtyParent.flags |= Flags.DirtyBounds;
          dirtyParent = dirtyParent.parent;
        }
        for (const child of node.children) {
          child.flags |= Flags.DirtyTransform;
        }
      }
      if (renderDirty) {
        mat2d.copy(node.transformRender, tmpMat2d2);

        let dirtyNode: SceneNode | null = node;
        while (dirtyNode) {
          dirtyNode.flags |= Flags.DirtyRender;
          dirtyNode = dirtyNode.parent;
        }
      }
    }

    queue.push(this);
    while ((node = queue.pop())) {
      if ((node.flags & Flags.DirtyBounds) === 0) {
        continue;
      }

      // Ensure children bounds.
      let needChildrenBounds = false;
      for (const child of node.children) {
        if ((child.flags & Flags.DirtyBounds) === 0) {
          continue;
        }

        if (!needChildrenBounds) {
          needChildrenBounds = true;
          queue.push(node);
        }
        queue.push(child);
      }
      if (needChildrenBounds) {
        continue;
      }

      // Compute local & world bounds.
      rect.copy(tmpRect1, node.boundsIntrinsic);
      for (const child of node.children) {
        rect.apply(tmpRect2, child.boundsLocal, child.transformLocal);
        rect.union(tmpRect1, tmpRect1, tmpRect2);
      }
      fpRect(tmpRect1);
      const updated = !rect.equals(tmpRect1, node.boundsLocal);
      node.flags &= ~Flags.DirtyBounds;

      // Propagate to parent.
      if (updated) {
        mat2d.copy(node.boundsLocal, tmpRect1);
        rect.apply(node.boundsWorld, node.boundsLocal, node.transformWorld);
        fpRect(node.boundsWorld);

        if (node.parent) {
          node.parent.flags |= Flags.DirtyBounds;
          queue.push(node.parent);
        }
      }
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
      this.parent.markLayoutDirty(false);
    }

    this.parent = parent;

    if (this.parent) {
      this.parent.children.splice(index, 0, this);
    } else if ((this.flags & Flags.IsRoot) === 0) {
      this.onRemoveFromStage();
    }

    this.markLayoutDirty();
  }

  setRenderObjects(objects: RenderObject[], intrinsicBounds: rect) {
    this.renderObjects = objects;

    rect.copy(this.boundsIntrinsic, intrinsicBounds);
    fpRect(this.boundsIntrinsic);
    this.markLayoutDirty(false);
  }

  render(ctx: RenderContext) {
    this.ensureLayout();
    this.renderRecursive(ctx);
  }

  private renderRecursive(ctx: RenderContext) {
    ctx.pushTransform(this.transformLocal, {
      colorMul: this.colorTransformLocalMul,
      colorAdd: this.colorTransformLocalAdd,
    });

    this.doRender(ctx);

    ctx.popTransform();
  }

  private doRender(ctx: RenderContext) {
    if (!this.visible) {
      return;
    }
    if (this.isMask && ctx.transform.renderMask !== this) {
      return;
    }

    rect.apply(tmpRect1, this.boundsLocal, ctx.transform.view);
    if (ctx.viewport && !rect.intersects(tmpRect1, ctx.viewport)) {
      return;
    }

    if (
      this.cacheAsBitmap &&
      this.cachedRender &&
      (this.flags & Flags.DirtyRender) === 0
    ) {
      ctx.pushTransform(this.cachedRender.view);
      ctx.renderObject(this.cachedRender.renderObject);
      ctx.popTransform();
      return;
    }

    this.flags &= ~Flags.DirtyRender;

    this.cachedRender?.return();
    this.cachedRender = null;

    this.doRenderMask(ctx);
  }

  private doRenderMask(ctx: RenderContext) {
    const mask = this.mask;
    if (mask) {
      mat2d.invert(tmpMat2d1, this.transformWorld);
      mat2d.multiply(tmpMat2d1, tmpMat2d1, mask.transformWorld);

      ctx.pushTransform(tmpMat2d1, { renderMask: mask });
      mask.doRender(ctx);
      ctx.popTransform();

      ctx.transform.useMask.push(mask);
    }

    this.doRenderFilter(ctx);
  }

  private doRenderFilter(ctx: RenderContext) {
    if (this.cacheAsBitmap || this.filters.length > 0) {
      const paddings = vec2.create();
      for (const filter of this.filters) {
        vec2.max(paddings, paddings, filter.paddings);
      }
      paddings[0] = Math.ceil(paddings[0]) * TWIPS;
      paddings[1] = Math.ceil(paddings[1]) * TWIPS;

      const viewMat = ctx.transform.view;

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
          ctx.renderCache(tex, bounds, viewMat, (render) => {
            this.cachedRender = render;
          });
          ctx.renderObject(RenderObject.rect(bounds, tex, { scale: TWIPS }));
        } else {
          ctx.renderObject(RenderObject.rect(bounds, tex, { scale: TWIPS }));
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

  onRemoveFromStage() {
    this.cachedRender?.return();
    this.cachedRender = null;
    for (const child of this.children) {
      child.onRemoveFromStage();
    }
  }

  hitTest(worldPt: vec2, exact: boolean): boolean {
    if (this.buttonState >= 0) {
      return this.children[3].hitTest(worldPt, true);
    }
    if (this.mask && !this.mask.hitTest(worldPt, exact)) {
      return false;
    }

    if (!exact) {
      this.ensureLayout();
      tmpVec2[0] = pixelToTwips(worldPt[0]);
      tmpVec2[1] = pixelToTwips(worldPt[1]);
      vec2.transformMat2d(tmpVec2, tmpVec2, this.transformWorldInvert);
      return rect.contains(this.boundsLocal, tmpVec2[0], tmpVec2[1]);
    }

    const nodes: SceneNode[] = [this];
    let node: SceneNode | undefined;
    while ((node = nodes.pop())) {
      if (node.renderObjects.length > 0) {
        tmpVec2[0] = pixelToTwips(worldPt[0]);
        tmpVec2[1] = pixelToTwips(worldPt[1]);
        vec2.transformMat2d(tmpVec2, tmpVec2, node.transformWorldInvert);
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

  clone() {
    const nodeMap = new Map<SceneNode, SceneNode>();
    const clone = (n: SceneNode): SceneNode => {
      let node = nodeMap.get(n);
      if (node) {
        return node;
      }
      node = new SceneNode(n.object);
      nodeMap.set(n, node);

      node.visible = n.visible;
      node.isMask = n.isMask;
      node.buttonState = n.buttonState;
      node.renderObjects = n.renderObjects.slice();
      node.cacheAsBitmap = n.cacheAsBitmap;
      node.filters = n.filters.slice();
      rect.copy(node.boundsIntrinsic, n.boundsIntrinsic);
      mat2d.copy(node.transformLocal, n.transformLocal);
      vec4.copy(node.colorTransformLocalMul, n.colorTransformLocalMul);
      vec4.copy(node.colorTransformLocalAdd, n.colorTransformLocalAdd);

      node.mask = n.mask && clone(n.mask);
      for (const child of n.children) {
        const clonedChild = clone(child);
        node.children.push(clonedChild);
        clonedChild.parent = node;
      }

      return node;
    };

    return clone(this);
  }
}
