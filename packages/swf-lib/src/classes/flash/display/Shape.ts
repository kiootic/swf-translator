import { Container } from "pixi.js";
import { DisplayObject } from "./DisplayObject";

export class Shape extends DisplayObject {
  static readonly __pixiClass = Container;

  declare readonly __pixi: Container;

  get width(): number {
    return this.__pixi.width;
  }
  set width(value: number) {
    this.__pixi.width = value;
  }

  get height(): number {
    return this.__pixi.height;
  }
  set height(value: number) {
    this.__pixi.height = value;
  }
}
