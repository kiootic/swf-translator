import { mat2d, vec4, vec2 } from "gl-matrix";
import { RenderObject } from "./RenderObject";
import { rect } from "../math/rect";
import { multiplyColorTransform } from "../math/color";
import { projection } from "../math/matrix";
import { Texture } from "./gl/Texture";
import { FilterInstance } from "./filter/Filter";

export interface Transform {
  view: mat2d;
  colorMul: vec4;
  colorAdd: vec4;
}

export type DeferredRender =
  | DeferredRenderObject
  | DeferredRenderTexture
  | DeferredRenderFilter;

export interface DeferredRenderObject {
  transform: Transform;
  object: RenderObject;
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

export interface RenderContextParams {
  bounds: rect;
  projectionSize: vec2 | null;
  invertY?: boolean;
}

export class RenderContext {
  readonly bounds: rect;
  readonly renders: DeferredRender[] = [];
  readonly transformStack: Transform[] = [];
  readonly projection: mat2d;
  readonly postProjection: mat2d;

  get transform(): Transform {
    return this.transformStack[this.transformStack.length - 1];
  }
  set transform(transform: Transform) {
    this.transformStack[this.transformStack.length - 1] = transform;
  }

  constructor(params: RenderContextParams) {
    const { bounds, projectionSize, invertY = true } = params;

    this.transformStack.push({
      view: mat2d.identity(mat2d.create()),
      colorMul: vec4.set(vec4.create(), 1, 1, 1, 1),
      colorAdd: vec4.set(vec4.create(), 0, 0, 0, 0),
    });
    this.bounds = bounds;

    this.projection = mat2d.create();
    this.postProjection = mat2d.create();
    if (projectionSize) {
      projection(
        this.projection,
        projectionSize[0],
        projectionSize[1],
        invertY
      );
    }
  }

  pushTransform(view: mat2d, colorMul: vec4, colorAdd: vec4) {
    const transform = this.transformStack[this.transformStack.length - 1];
    const nodeTransform: Transform = {
      view: mat2d.create(),
      colorAdd: vec4.create(),
      colorMul: vec4.create(),
    };
    mat2d.multiply(nodeTransform.view, transform.view, view);
    multiplyColorTransform(
      nodeTransform.colorMul,
      nodeTransform.colorAdd,
      transform.colorMul,
      transform.colorAdd,
      colorMul,
      colorAdd
    );
    this.transformStack.push(nodeTransform);
  }

  dupTransform() {
    const transform = this.transform;
    const nodeTransform: Transform = {
      view: mat2d.clone(transform.view),
      colorAdd: vec4.clone(transform.colorAdd),
      colorMul: vec4.clone(transform.colorMul),
    };
    this.transformStack.push(nodeTransform);
  }

  popTransform() {
    const transform = this.transformStack.pop()!;
    vec4.scale(transform.colorAdd, transform.colorAdd, 1 / 0xff);
    mat2d.multiply(transform.view, this.postProjection, transform.view);
    mat2d.multiply(transform.view, this.projection, transform.view);
  }

  renderObject(object: RenderObject) {
    this.renders.push({
      transform: this.transform,
      object,
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
    mat2d.scale(viewMatrix, viewMatrix, [1 / scale[0], 1 / scale[1]]);
    mat2d.translate(viewMatrix, viewMatrix, [-paddings[0], -paddings[1]]);

    const translate = vec2.fromValues(viewMatrix[4], viewMatrix[5]);
    viewMatrix[4] = Math.floor(viewMatrix[4]);
    viewMatrix[5] = Math.floor(viewMatrix[5]);

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
