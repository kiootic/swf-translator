import { mat2d } from "gl-matrix";

export class Matrix {
  __value: mat2d;

  constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
    this.__value = mat2d.fromValues(a, b, c, d, tx, ty);
  }

  get a() {
    return this.__value[0];
  }

  set a(value: number) {
    this.__value[0] = value;
  }

  get b() {
    return this.__value[1];
  }

  set b(value: number) {
    this.__value[1] = value;
  }

  get c() {
    return this.__value[2];
  }

  set c(value: number) {
    this.__value[2] = value;
  }

  get d() {
    return this.__value[3];
  }

  set d(value: number) {
    this.__value[3] = value;
  }

  get tx() {
    return this.__value[4];
  }

  set tx(value: number) {
    this.__value[4] = value;
  }

  get ty() {
    return this.__value[5];
  }

  set ty(value: number) {
    this.__value[5] = value;
  }
}
