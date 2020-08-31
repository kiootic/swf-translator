import { vec4 } from "gl-matrix";
import { SceneNode } from "../../../internal/render/SceneNode";

export class ColorTransform {
  __node: SceneNode | null = null;
  __mul: vec4;
  __add: vec4;

  constructor(
    redMul = 1,
    greenMul = 1,
    blueMul = 1,
    alphaMul = 1,
    redAdd = 0,
    greenAdd = 0,
    blueAdd = 0,
    alphaAdd = 0
  ) {
    this.__mul = vec4.fromValues(redMul, greenMul, blueMul, alphaMul);
    this.__add = vec4.fromValues(redAdd, greenAdd, blueAdd, alphaAdd);
  }

  __setNode(value: SceneNode | null) {
    if (value) {
      vec4.copy(value.colorTransformLocalMul, this.__mul);
      vec4.copy(value.colorTransformLocalAdd, this.__add);
      this.__mul = value.colorTransformLocalMul;
      this.__add = value.colorTransformLocalAdd;
    } else {
      this.__mul = vec4.clone(this.__mul);
      this.__add = vec4.clone(this.__add);
    }
    this.__node = value;
  }

  set color(value: number) {
    this.__add[0] = (value >>> 16) & 0xff;
    this.__add[1] = (value >>> 8) & 0xff;
    this.__add[2] = (value >>> 0) & 0xff;
    this.__mul[0] = 0;
    this.__mul[1] = 0;
    this.__mul[2] = 0;
    this.__node?.markColorTransformDirty();
  }
}
