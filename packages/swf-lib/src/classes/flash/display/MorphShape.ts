import { DisplayObject } from "./DisplayObject";
import { MorphShapeInstance } from "../../../internal/character/MorphShapeInstance";

export class MorphShape extends DisplayObject {
  static __character?: MorphShapeInstance;

  declare __character: MorphShapeInstance | null;

  constructor() {
    super();
  }

  __initChar() {
    this.__ratio = 0;
    this.__character =
      (this.constructor as typeof MorphShape).__character ?? null;
    this.__character?.applyTo(this);

    super.__initChar();
  }

  private ___ratio = 0;

  get __ratio() {
    return this.___ratio;
  }

  set __ratio(value) {
    this.___ratio = value;
    this.__character?.applyTo(this);
  }
}
