import { mat2d, vec4, vec2 } from "gl-matrix";
import { RenderObject } from "./RenderObject";
import { rect } from "../math/rect";
import { multiplyColorTransform } from "../math/color";

export interface Transform {
  view: mat2d;
  colorMul: vec4;
  colorAdd: vec4;
}

export type DeferredRender = DeferredRenderObject | DeferredRenderTexture;

export interface DeferredRenderObject {
  transform: Transform;
  object: RenderObject;
}

export interface DeferredRenderTexture {
  transform: Transform;
  texture: {
    bounds: rect;
    fn: (ctx: RenderContext) => void;
    then: (ctx: RenderContext, result: RenderObject) => void;
  };
}

export class RenderContext {
  readonly bounds: rect;
  readonly renders: DeferredRender[] = [];
  readonly transformStack: Transform[] = [];
  readonly projection: mat2d;

  get transform(): Transform {
    return this.transformStack[this.transformStack.length - 1];
  }
  set transform(transform: Transform) {
    this.transformStack[this.transformStack.length - 1] = transform;
  }

  constructor(bounds: rect, projection = true, invertY = true) {
    this.transformStack.push({
      view: mat2d.identity(mat2d.create()),
      colorMul: vec4.set(vec4.create(), 1, 1, 1, 1),
      colorAdd: vec4.set(vec4.create(), 0, 0, 0, 0),
    });
    this.bounds = rect.copy(rect.create(), bounds);
    this.projection = mat2d.create();

    if (projection) {
      this.projection[0] = 2 / bounds[2];
      this.projection[3] = (invertY ? -2 : 2) / bounds[3];
      this.projection[4] = -1;
      this.projection[5] = invertY ? 1 : -1;
      mat2d.translate(this.projection, this.projection, [
        -bounds[0],
        -bounds[1],
      ]);
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
    fn: (ctx: RenderContext) => void,
    then: (ctx: RenderContext, result: RenderObject) => void
  ) {
    this.dupTransform();
    const viewMatrix = this.transform.view;
    mat2d.translate(viewMatrix, viewMatrix, [bounds[0], bounds[1]]);
    viewMatrix[4] = Math.floor(viewMatrix[4]);
    viewMatrix[5] = Math.floor(viewMatrix[5]);
    this.renders.push({
      transform: this.transform,
      texture: {
        bounds: rect.copy(rect.create(), bounds),
        fn,
        then,
      },
    });
    this.popTransform();
  }
}
