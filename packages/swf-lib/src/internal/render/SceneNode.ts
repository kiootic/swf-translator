import { mat2d, vec2, vec4 } from "gl-matrix";
import { RenderObjectSprite } from "./objects/RenderObjectSprite";
import { rect } from "../math/rect";
import { multiplyColorTransform } from "../math/color";
import { RenderContext } from "./RenderContext";
import { RenderTarget } from "./RenderTarget";
import { Filter } from "./Filter";

const enum Flags {
  DirtyBounds = 1,
  DirtyTransform = 2,
  DirtyColorTransform = 4,
  DirtyRender = 8,

  DirtyAll = 15,
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
  renderObjects: RenderObjectSprite[] = [];
  readonly boundsIntrinsic = rect.create();

  cacheAsBitmap = false;
  filters: Filter[] = [];
  renderTarget: RenderTarget | null = null;
  renderTargetDirty = false;

  readonly transformLocal = mat2d.identity(mat2d.create());
  readonly colorTransformLocalMul = vec4.fromValues(1, 1, 1, 1);
  readonly colorTransformLocalAdd = vec4.fromValues(0, 0, 0, 0);

  readonly boundsLocal = rect.create();
  readonly boundsWorld = rect.create();
  readonly transformWorld = mat2d.identity(mat2d.create());
  readonly transformWorldInvert = mat2d.identity(mat2d.create());
  readonly colorTransformWorldMul = vec4.fromValues(1, 1, 1, 1);
  readonly colorTransformWorldAdd = vec4.fromValues(0, 0, 0, 0);

  get isRenderToBitmap() {
    return this.cacheAsBitmap || this.filters.length > 0;
  }

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
    if (this.isRenderToBitmap) {
      this.boundsLocal[0] = Math.floor(this.boundsLocal[0]);
      this.boundsLocal[1] = Math.floor(this.boundsLocal[1]);
      this.boundsLocal[2] += 1;
      this.boundsLocal[3] += 1;
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
      if (!node.parent || node.parent.isRenderToBitmap) {
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

  markColorTransformDirty() {
    this.flags |= Flags.DirtyColorTransform;
    this.markRenderDirty();
  }

  ensureWorldColorTransform() {
    let node: SceneNode | null = this;
    while (node && (node.flags & Flags.DirtyColorTransform) === 0) {
      node = node.parent;
    }
    if (!node) {
      return;
    }

    node.updateWorldColorTransform();
  }

  updateWorldColorTransform() {
    const nodes: SceneNode[] = [this];
    let node: SceneNode | undefined;
    while ((node = nodes.pop())) {
      if (!node.parent || node.parent.isRenderToBitmap) {
        vec4.copy(node.colorTransformWorldAdd, node.colorTransformLocalAdd);
        vec4.copy(node.colorTransformWorldMul, node.colorTransformLocalMul);
      } else {
        multiplyColorTransform(
          node.colorTransformWorldMul,
          node.colorTransformWorldAdd,
          node.parent.colorTransformWorldMul,
          node.parent.colorTransformWorldAdd,
          node.colorTransformLocalMul,
          node.colorTransformLocalAdd
        );
      }

      node.flags &= ~Flags.DirtyColorTransform;
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
    } else {
      this.cleanupRenderTarget();
    }

    this.markTransformDirty();
    this.markColorTransformDirty();
  }

  setRenderObjects(objects: RenderObjectSprite[], intrinsicBounds: rect) {
    this.renderObjects = objects;
    this.updateRenderObjects();

    rect.copy(this.boundsIntrinsic, intrinsicBounds);
    this.markBoundsDirty();
    this.markRenderDirty();
  }

  updateRenderObjects() {
    for (const obj of this.renderObjects) {
      mat2d.copy(obj.renderMatrix, this.transformWorld);
      vec4.copy(obj.colorMul, this.colorTransformWorldMul);
      vec4.copy(obj.colorAdd, this.colorTransformWorldAdd);
    }
  }

  render(ctx: RenderContext) {
    if (!this.visible || !rect.intersects(this.boundsWorld, ctx.bounds)) {
      return;
    }

    const [x, y, width, height] = this.boundsLocal;
    if (this.isRenderToBitmap && width > 0 && height > 0) {
      let dirty = (this.flags & Flags.DirtyRender) !== 0;

      let target = this.renderTarget;
      if (!target) {
        target = new RenderTarget();
        this.renderTarget = target;
        dirty = true;
      }

      let padX = 4,
        padY = 4;
      for (const filter of this.filters) {
        padX = Math.max(padX, filter.padX);
        padY = Math.max(padY, filter.padY);
      }
      const scaleX = Math.abs(this.transformWorld[0]);
      const scaleY = Math.abs(this.transformWorld[3]);
      if (target.resize(ctx.gl, this.boundsLocal, padX, padY, scaleX, scaleY)) {
        dirty = true;
      }

      if (dirty) {
        ctx.renderer.renderToTarget(target, (ctx) => {
          this.doRender(ctx);
        });
        for (const filter of this.filters) {
          ctx.renderer.applyFilter(target, filter);
        }
      }

      mat2d.translate(target.renderMatrix, this.transformWorld, [x, y]);
      target.renderMatrix[4] = Math.floor(target.renderMatrix[4]);
      target.renderMatrix[5] = Math.floor(target.renderMatrix[5]);
      vec4.copy(target.colorMul, this.colorTransformWorldMul);
      vec4.copy(target.colorAdd, this.colorTransformWorldAdd);
      target.renderTo(ctx);

      return;
    } else if (this.renderTarget) {
      this.cleanupRenderTarget();
    }

    this.doRender(ctx);
  }

  doRender(ctx: RenderContext) {
    this.flags &= ~Flags.DirtyRender;

    this.updateRenderObjects();

    for (const o of this.renderObjects) {
      ctx.render(o);
    }

    if (this.buttonState >= 0) {
      this.children[this.buttonState].render(ctx);
    } else {
      for (const child of this.children) {
        child.render(ctx);
      }
    }
  }

  cleanupRenderTarget() {
    this.renderTarget?.delete();
    this.renderTarget = null;
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
        node.updateRenderObjects();
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
