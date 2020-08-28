import { mat2d } from "gl-matrix";
import { createAtom } from "mobx";

export class Matrix {
  __atom = createAtom("Matrix");

  __value: mat2d;

  constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
    this.__value = mat2d.fromValues(a, b, c, d, tx, ty);
  }

  get a() {
    this.__atom.reportObserved();
    return this.__value[0];
  }

  set a(value: number) {
    this.__value[0] = value;
    this.__atom.reportChanged();
  }

  get b() {
    this.__atom.reportObserved();
    return this.__value[1];
  }

  set b(value: number) {
    this.__value[1] = value;
    this.__atom.reportChanged();
  }

  get c() {
    this.__atom.reportObserved();
    return this.__value[2];
  }

  set c(value: number) {
    this.__value[2] = value;
    this.__atom.reportChanged();
  }

  get d() {
    this.__atom.reportObserved();
    return this.__value[3];
  }

  set d(value: number) {
    this.__value[3] = value;
    this.__atom.reportChanged();
  }

  get tx() {
    this.__atom.reportObserved();
    return this.__value[4];
  }

  set tx(value: number) {
    this.__value[4] = value;
    this.__atom.reportChanged();
  }

  get ty() {
    this.__atom.reportObserved();
    return this.__value[5];
  }

  set ty(value: number) {
    this.__value[5] = value;
    this.__atom.reportChanged();
  }

  translate(dx: number, dy: number) {
    mat2d.translate(this.__value, this.__value, [dx, dy]);
    this.__atom.reportChanged();
  }

  scale(sx: number, sy: number) {
    mat2d.scale(this.__value, this.__value, [sx, sy]);
    this.__atom.reportChanged();
  }

  rotate(angle: number) {
    mat2d.rotate(this.__value, this.__value, angle);
    this.__atom.reportChanged();
  }
}
