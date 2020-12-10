import { mat2d, vec4, vec2 } from "gl-matrix";
import { RenderObject } from "./RenderObject";
import { rect } from "../math/rect";
import { multiplyColorTransform } from "../math/color";
import { Texture } from "./gl/Texture";
import { FilterInstance } from "./filter/Filter";
import { CachedRender } from "./CachedRender";
import { TWIPS, twipsToPixel } from "../twips";
import { fpMat } from "../fp16";

export interface Transform {
  view: mat2d;
  colorMul: vec4;
  colorAdd: vec4;
  renderMask: unknown;
  useMask: unknown[];
}

export type DeferredRender =
  | DeferredRenderObject
  | DeferredRenderCache
  | DeferredRenderTexture
  | DeferredRenderFilter;

export interface DeferredRenderObject {
  transform: Transform;
  object: RenderObject;
}

export interface DeferredRenderCache {
  transform: Transform;
  cache: {
    texture: Texture;
    bounds: rect;
    view: mat2d;
    then: (render: CachedRender) => void;
  };
}

export interface DeferredRenderTexture {
  transform: Transform;
  texture: {
    bounds: rect;
    paddings: vec2;
    scale: vec2;
    translate: vec2;
    fn: (ctx: RenderContext) => void;
    then: (ctx: RenderContext, texture: Texture, bounds: rect) => void;
  };
}

export interface DeferredRenderFilter {
  transform: Transform;
  filter: {
    texture: Texture;
    bounds: rect;
    instance: FilterInstance;
    then: (ctx: RenderContext, texture: Texture, bounds: rect) => void;
  };
}

const colorMulIdentity = vec4.fromValues(1, 1, 1, 1);
const colorAddIdentity = vec4.fromValues(0, 0, 0, 0);

export class RenderContext {
  readonly viewport: rect | null;
  readonly renders: DeferredRender[] = [];
  readonly transformStack: Transform[] = [];
  readonly allTransforms: Transform[] = [];

  get transform(): Transform {
    return this.transformStack[this.transformStack.length - 1];
  }
  set transform(transform: Transform) {
    this.transformStack[this.transformStack.length - 1] = transform;
  }

  get bounds(): rect {
    const bounds = rect.create();
    const renderBounds = rect.create();
    for (const render of this.renders) {
      if ("object" in render) {
        rect.apply(renderBounds, render.object.bounds, render.transform.view);
      } else if ("texture" in render) {
        rect.copy(renderBounds, render.texture.bounds);
        renderBounds[0] -= render.texture.paddings[0];
        renderBounds[1] -= render.texture.paddings[1];
        renderBounds[2] += render.texture.paddings[0] * 2;
        renderBounds[3] += render.texture.paddings[1] * 2;
        rect.apply(renderBounds, renderBounds, render.transform.view);
      } else if ("filter" in render) {
        rect.apply(renderBounds, render.filter.bounds, render.transform.view);
      }
      rect.union(bounds, bounds, renderBounds);
    }
    return bounds;
  }

  constructor(viewport: rect | null) {
    this.transformStack.push({
      view: mat2d.identity(mat2d.create()),
      colorMul: vec4.set(vec4.create(), 1, 1, 1, 1),
      colorAdd: vec4.set(vec4.create(), 0, 0, 0, 0),
      renderMask: null,
      useMask: [],
    });
    this.allTransforms.push(this.transformStack[0]);
    this.viewport = viewport;
  }

  pushTransform(
    view: mat2d,
    opts?: Partial<
      Pick<Transform, "colorAdd" | "colorMul" | "useMask" | "renderMask">
    >
  ) {
    const transform = this.transformStack[this.transformStack.length - 1];
    const nodeTransform: Transform = {
      view: mat2d.create(),
      colorAdd: vec4.create(),
      colorMul: vec4.create(),
      renderMask: opts?.renderMask ?? transform.renderMask,
      useMask: transform.useMask.slice(),
    };
    mat2d.multiply(nodeTransform.view, transform.view, view);
    fpMat(nodeTransform.view);
    multiplyColorTransform(
      nodeTransform.colorMul,
      nodeTransform.colorAdd,
      transform.colorMul,
      transform.colorAdd,
      opts?.colorMul ?? colorMulIdentity,
      opts?.colorAdd ?? colorAddIdentity
    );
    if (opts?.useMask) {
      nodeTransform.useMask.push(opts.useMask);
    }
    this.transformStack.push(nodeTransform);
    this.allTransforms.push(nodeTransform);
  }

  dupTransform() {
    const transform = this.transform;
    const nodeTransform: Transform = {
      view: mat2d.clone(transform.view),
      colorAdd: vec4.clone(transform.colorAdd),
      colorMul: vec4.clone(transform.colorMul),
      renderMask: transform.renderMask,
      useMask: transform.useMask.slice(),
    };
    this.transformStack.push(nodeTransform);
    this.allTransforms.push(nodeTransform);
  }

  popTransform() {
    this.transformStack.pop();
  }

  renderContext(ctx: RenderContext) {
    const { view, colorMul, colorAdd } = this.transform;
    for (const transform of ctx.allTransforms) {
      mat2d.multiply(transform.view, view, transform.view);
      multiplyColorTransform(
        transform.colorMul,
        transform.colorAdd,
        colorMul,
        colorAdd,
        transform.colorMul,
        transform.colorAdd
      );
      this.allTransforms.push(transform);
    }
    this.renders.push(...ctx.renders);
  }

  renderObject(object: RenderObject) {
    this.renders.push({
      transform: this.transform,
      object,
    });
  }

  renderCache(
    texture: Texture,
    bounds: rect,
    baseViewMat: mat2d,
    then: (render: CachedRender) => void
  ) {
    // Extract correct view matrix for rendering cached texture.
    const view = mat2d.invert(mat2d.create(), baseViewMat);
    mat2d.multiply(view, view, this.transform.view);
    this.renders.push({
      transform: this.transform,
      cache: { view, texture, bounds, then },
    });
  }

  renderTexture(
    bounds: rect,
    paddings: vec2,
    fn: (ctx: RenderContext) => void,
    then: (ctx: RenderContext, texture: Texture, bounds: rect) => void
  ) {
    this.dupTransform();

    const viewMatrix = this.transform.view;
    mat2d.translate(viewMatrix, viewMatrix, [bounds[0], bounds[1]]);

    const scale = vec2.fromValues(
      Math.abs(viewMatrix[0]),
      Math.abs(viewMatrix[3])
    );
    if (scale[0] !== 0 && scale[1] !== 0) {
      mat2d.scale(viewMatrix, viewMatrix, [1 / scale[0], 1 / scale[1]]);
    }
    mat2d.translate(viewMatrix, viewMatrix, [-paddings[0], -paddings[1]]);

    const translate = vec2.fromValues(
      twipsToPixel(viewMatrix[4]),
      twipsToPixel(viewMatrix[5])
    );
    viewMatrix[4] = Math.trunc(viewMatrix[4] / TWIPS) * TWIPS;
    viewMatrix[5] = Math.trunc(viewMatrix[5] / TWIPS) * TWIPS;

    this.renders.push({
      transform: this.transform,
      texture: {
        bounds: rect.copy(rect.create(), bounds),
        paddings,
        scale,
        translate,
        fn,
        then,
      },
    });
    this.popTransform();
  }

  renderFilter(
    texture: Texture,
    bounds: rect,
    instance: FilterInstance,
    then: (ctx: RenderContext, texture: Texture, bounds: rect) => void
  ) {
    this.renders.push({
      transform: this.transform,
      filter: {
        texture,
        bounds,
        instance,
        then,
      },
    });
  }
}
