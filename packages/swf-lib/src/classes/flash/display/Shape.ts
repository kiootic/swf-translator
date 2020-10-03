import { DisplayObject } from "./DisplayObject";
import { ShapeInstance } from "../../../internal/character/ShapeInstance";
import { Graphics } from "./Graphics";

export class Shape extends DisplayObject {
  static __character?: ShapeInstance;

  declare __character: ShapeInstance | null;

  readonly graphics: Graphics;

  constructor() {
    super();

    this.graphics = new Graphics(this.__node);
  }

  __preInit() {
    this.__character = (this.constructor as typeof Shape).__character ?? null;
    this.__character?.applyTo(this);

    super.__preInit();
  }
}
