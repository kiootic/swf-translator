import { DisplayObject } from "./DisplayObject";

export abstract class InteractiveObject extends DisplayObject {
  constructor() {
    super();
    this.__pixi.interactive = true;
  }
}
