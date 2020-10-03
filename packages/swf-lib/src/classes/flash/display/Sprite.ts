import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { SpriteInstance } from "../../../internal/character/SpriteInstance";
import { Graphics } from "./Graphics";

export class Sprite extends DisplayObjectContainer {
  static __character?: SpriteInstance;

  declare __character: SpriteInstance | null;

  readonly graphics: Graphics;

  constructor() {
    super();

    this.graphics = new Graphics(this.__node);
  }

  __preInit() {
    this.__children = [];
    this.__character = (this.constructor as typeof Sprite).__character ?? null;
    this.__character?.applyTo(this, 1, 1);

    super.__preInit();
  }

  buttonMode = false;

  get __isPointerCursor() {
    return this.buttonMode || super.__isPointerCursor;
  }
}
