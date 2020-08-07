import { vec2 } from "gl-matrix";

export class Point {
  readonly __value = vec2.create();

  get x() {
    return this.__value[0];
  }
  get y() {
    return this.__value[1];
  }

  constructor(x = 0, y = 0) {
    vec2.set(this.__value, x, y);
  }
}
