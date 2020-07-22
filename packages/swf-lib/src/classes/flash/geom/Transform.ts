import type { DisplayObject } from "../display/DisplayObject";
import { Matrix } from "./Matrix";

export class Transform {
  private __displayObject: DisplayObject;
  private __matrix!: Matrix;

  constructor(displayObject: DisplayObject) {
    this.__displayObject = displayObject;
    this.matrix = new Matrix();
  }

  get matrix(): Matrix {
    return this.__matrix;
  }

  set matrix(value: Matrix) {
    this.__matrix = value;
    this.__displayObject.__pixi.transform.setFromMatrix(value.__pixi);
    this.__displayObject.__pixi.transform.localTransform = value.__pixi;
  }
}
