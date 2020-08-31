import { DisplayObject } from "../display/DisplayObject";
import { StaticTextInstance } from "../../../internal/character/StaticTextInstance";

export class StaticText extends DisplayObject {
  static __character?: StaticTextInstance;

  declare __character: StaticTextInstance | null;

  constructor() {
    super();

    this.__character =
      (this.constructor as typeof StaticText).__character ?? null;
    this.__character?.applyTo(this);
  }
}
