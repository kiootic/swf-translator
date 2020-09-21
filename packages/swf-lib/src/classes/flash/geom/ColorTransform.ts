import { vec4 } from "gl-matrix";
import { SceneNode } from "../../../internal/render2/SceneNode";

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

  get redMultiplier() {
    return this.__mul[0];
  }
  set redMultiplier(value) {
    this.__mul[0] = value;
  }

  get greenMultiplier() {
    return this.__mul[1];
  }
  set greenMultiplier(value) {
    this.__mul[1] = value;
  }

  get blueMultiplier() {
    return this.__mul[2];
  }
  set blueMultiplier(value) {
    this.__mul[2] = value;
  }

  get alphaMultiplier() {
    return this.__mul[3];
  }
  set alphaMultiplier(value) {
    this.__mul[3] = value;
  }

  get redOffset() {
    return this.__add[0];
  }
  set redOffset(value) {
    this.__add[0] = value;
  }

  get greenOffset() {
    return this.__add[1];
  }
  set greenOffset(value) {
    this.__add[1] = value;
  }

  get blueOffset() {
    return this.__add[2];
  }
  set blueOffset(value) {
    this.__add[2] = value;
  }

  get alphaOffset() {
    return this.__add[3];
  }
  set alphaOffset(value) {
    this.__add[3] = value;
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
  }
}
