import { vec2 } from "gl-matrix";
import { BitmapFilter } from "./BitmapFilter";
import {
  DropShadowFilterInstance,
  DropShadowFilter as RenderDropShadowFilter,
} from "../../../internal/render2/filter/DropShadowFilter";

export class DropShadowFilter extends BitmapFilter {
  get __filter(): DropShadowFilterInstance {
    return {
      filter: RenderDropShadowFilter.instance,
      paddings: vec2.fromValues(
        this.blurX + this.distance,
        this.blurY + this.distance
      ),
      blurX: this.blurX,
      blurY: this.blurY,
      passes: this.quality,
      color: this.color,
      strength: this.strength,
      angle: (this.angle * Math.PI) / 180,
      distance: this.distance,
      knockout: this.knockout,
    };
  }

  blurX = 0;
  blurY = 0;
  quality = 3;
  color = 0xffffff;
  strength = 1;
  angle = 45;
  distance = 4;
  knockout = false;
  hideObject = false;
  inner = false;
}
