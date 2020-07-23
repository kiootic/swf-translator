import { Container } from "pixi.js";
import { DisplayObject } from "../display/DisplayObject";
import { StaticTextInstance } from "../../../internal/character/StaticTextInstance";

export class StaticText extends DisplayObject {
  static readonly __pixiClass = Container;

  declare readonly __pixi: Container;
  declare __character: StaticTextInstance | null;

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
