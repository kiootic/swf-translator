import { rect } from "../../../internal/math/rect";

export class Rectangle {
  static readonly __empty = new Rectangle();

  readonly __rect: rect;

  get x() {
    return this.__rect[0];
  }
  set x(value) {
    this.__rect[0] = value;
  }

  get y() {
    return this.__rect[1];
  }
  set y(value) {
    this.__rect[1] = value;
  }

  get width() {
    return this.__rect[2];
  }
  set width(value) {
    this.__rect[2] = value;
  }

  get height() {
    return this.__rect[3];
  }
  set height(value) {
    this.__rect[3] = value;
  }

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.__rect = rect.fromValues(x, y, width, height);
  }

  equals(r: Rectangle) {
    return rect.equals(this.__rect, r.__rect);
  }
}
