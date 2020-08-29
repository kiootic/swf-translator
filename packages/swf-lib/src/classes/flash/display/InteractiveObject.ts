import { DisplayObject } from "./DisplayObject";

export abstract class InteractiveObject extends DisplayObject {
  constructor() {
    super();
  }

  get __isPointerCursor(): boolean {
    return this.parent ? this.parent.__isPointerCursor : false;
  }

  tabEnabled = false;

  tabIndex = -1;
}
