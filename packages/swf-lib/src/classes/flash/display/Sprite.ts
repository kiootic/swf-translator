import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { SpriteInstance } from "../../../internal/character/SpriteInstance";
import { observable } from "mobx";

export class Sprite extends DisplayObjectContainer {
  static __character?: SpriteInstance;

  declare __character: SpriteInstance | null;

  constructor() {
    super();

    this.__character = (this.constructor as typeof Sprite).__character ?? null;
    this.__character?.applyTo(this, 1, 1);
  }

  buttonMode = false;

  get __cursor() {
    return this.buttonMode ? "pointer" : super.__cursor;
  }
}
