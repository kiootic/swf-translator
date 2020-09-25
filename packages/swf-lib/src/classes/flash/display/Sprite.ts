import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { SpriteInstance } from "../../../internal/character/SpriteInstance";
import { Graphics } from "./Graphics";

export class Sprite extends DisplayObjectContainer {
  static __character?: SpriteInstance;

  declare __character: SpriteInstance | null;

  readonly graphics: Graphics;

  constructor() {
    super();

    this.__character = (this.constructor as typeof Sprite).__character ?? null;
    this.__character?.applyTo(this, 1, 1);

    this.graphics = new Graphics(this.__node);
  }

  buttonMode = false;

  get __isPointerCursor() {
    return this.buttonMode || super.__isPointerCursor;
  }
}
