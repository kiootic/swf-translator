import { vec2 } from "gl-matrix";
import { BitmapFilter } from "./BitmapFilter";
import {
  DropShadowFilterInstance,
  DropShadowFilter as RenderDropShadowFilter,
} from "../../../internal/render2/filter/DropShadowFilter";

export class GlowFilter extends BitmapFilter {
  get __filter(): DropShadowFilterInstance {
    return {
      filter: RenderDropShadowFilter.instance,
      paddings: vec2.fromValues(this.blurX, this.blurY),
      blurX: this.blurX,
      blurY: this.blurY,
      passes: this.quality,
      color: Math.floor(this.alpha * 0xff) * 0x1000000 + this.color,
      strength: this.strength,
      angle: 0,
      distance: 0,
      knockout: this.knockout,
    };
  }

  constructor(
    public color = 0xff0000,
    public alpha = 1.0,
    public blurX = 6.0,
    public blurY = 6.0,
    public strength = 2,
    public quality = 1,
    public inner = false,
    public knockout = false
  ) {
    super();
  }
}
