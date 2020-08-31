import { DisplayObject } from "./DisplayObject";
import { ShapeInstance } from "../../../internal/character/ShapeInstance";

export class Shape extends DisplayObject {
  static __character?: ShapeInstance;

  declare __character: ShapeInstance | null;

  constructor() {
    super();

    this.__character = (this.constructor as typeof Shape).__character ?? null;
    this.__character?.applyTo(this);
  }
}
