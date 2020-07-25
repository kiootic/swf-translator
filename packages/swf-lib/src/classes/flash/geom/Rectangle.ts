import { rect } from "../../../internal/math/rect";

export class Rectangle {
  static readonly __empty = new Rectangle();

  readonly __rect: rect;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.__rect = rect.fromValues(x, y, width, height);
  }

  equals(r: Rectangle) {
    return rect.equals(this.__rect, r.__rect);
  }
}
