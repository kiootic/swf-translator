import { vec4 } from "gl-matrix";
import { createAtom } from "mobx";

export class ColorTransform {
  __atom = createAtom("ColorTransform");

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

  set color(value: number) {
    this.__add[0] = (value >>> 16) & 0xff;
    this.__add[1] = (value >>> 8) & 0xff;
    this.__add[2] = (value >>> 0) & 0xff;
    this.__mul[0] = 0;
    this.__mul[1] = 0;
    this.__mul[2] = 0;
    this.__atom.reportChanged();
  }

  concat(transform: ColorTransform) {
    vec4.mul(this.__mul, this.__mul, transform.__mul);
    vec4.mul(this.__add, this.__add, transform.__mul);
    vec4.add(this.__add, this.__add, transform.__add);
  }

  __concat(a: ColorTransform, b: ColorTransform) {
    vec4.mul(this.__mul, a.__mul, b.__mul);
    vec4.mul(this.__add, a.__add, b.__mul);
    vec4.add(this.__add, this.__add, b.__add);
  }
}
