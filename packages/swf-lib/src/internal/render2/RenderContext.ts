import { mat2d, vec4 } from "gl-matrix";
import { RenderObject } from "./RenderObject";
import { rect } from "../math/rect";

export interface DeferredRender {
  transform: mat2d;
  colorMul: vec4;
  colorAdd: vec4;

  object: RenderObject;
}

export class RenderContext {
  readonly renders: DeferredRender[] = [];

  constructor(readonly bounds: rect) {}

  renderObject(
    transform: mat2d,
    colorMul: vec4,
    colorAdd: vec4,
    object: RenderObject
  ) {
    this.renders.push({
      transform,
      colorMul,
      colorAdd,
      object,
    });
  }
}
