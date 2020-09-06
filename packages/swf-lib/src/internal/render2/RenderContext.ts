import { mat2d, vec4 } from "gl-matrix";
import { RenderObject } from "./RenderObject";
import { rect } from "../math/rect";
import { multiplyColorTransform } from "../math/color";

export interface Transform {
  view: mat2d;
  colorMul: vec4;
  colorAdd: vec4;
}

export interface DeferredRender {
  transform: Transform;
  object: RenderObject;
}

export class RenderContext {
  readonly renders: DeferredRender[] = [];
  readonly transformStack: Transform[] = [];
  readonly projection: mat2d;

  get transform(): Transform {
    return this.transformStack[this.transformStack.length - 1];
  }

  constructor(readonly bounds: rect) {
    this.transformStack.push({
      view: mat2d.identity(mat2d.create()),
      colorMul: vec4.set(vec4.create(), 1, 1, 1, 1),
      colorAdd: vec4.set(vec4.create(), 0, 0, 0, 0),
    });

    this.projection = mat2d.create();
    this.projection[0] = 2 / bounds[2];
    this.projection[3] = -2 / bounds[3];
    this.projection[4] = -1;
    this.projection[5] = 1;
    mat2d.translate(this.projection, this.projection, [bounds[0], bounds[1]]);
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

  popTransform() {
    const transform = this.transformStack.pop()!;
    vec4.scale(transform.colorAdd, transform.colorAdd, 1 / 0xff);
    mat2d.multiply(transform.view, this.projection, transform.view);
  }

  renderObject(object: RenderObject) {
    this.renders.push({
      transform: this.transformStack[this.transformStack.length - 1],
      object,
    });
  }
}
