import { DisplayObject } from "./DisplayObject";

export abstract class InteractiveObject extends DisplayObject {
  constructor() {
    super();
  }

  get __cursor(): string {
    return "default";
  }
}
