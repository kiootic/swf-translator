import { Container } from "pixi.js";
import { DisplayObject } from "./DisplayObject";

export class DisplayObjectContainer extends DisplayObject {
  static readonly __pixiClass = Container;

  declare readonly __pixi: Container;

  get numChildren(): number {
    return this.__pixi.children.length;
  }

  addChild(child: DisplayObject) {
    this.__pixi.addChild(child.__pixi);
    return child;
  }

  addChildAt(child: DisplayObject, index: number) {
    this.__pixi.addChildAt(child.__pixi, index);
    return child;
  }

  contains(child: DisplayObject) {
    return this.__pixi.children.includes(child.__pixi);
  }

  getChildAt(index: number) {
    return this.__pixi.getChildAt(index)?.__flash ?? null;
  }

  removeChild(child: DisplayObject) {
    return this.__pixi.removeChild(child.__pixi)?.__flash ?? null;
  }

  removeChildAt(index: number) {
    return this.__pixi.removeChildAt(index)?.__flash ?? null;
  }

  removeChildren(beginIndex = 0, endIndex = this.__pixi.children.length) {
    return this.__pixi.removeChildren(beginIndex, endIndex);
  }
}
