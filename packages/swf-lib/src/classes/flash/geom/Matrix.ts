import { Matrix as PIXIMatrix } from "pixi.js";

export class Matrix {
  __pixi: PIXIMatrix;

  constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
    this.__pixi = new PIXIMatrix(a, b, c, d, tx, ty);
  }
}
