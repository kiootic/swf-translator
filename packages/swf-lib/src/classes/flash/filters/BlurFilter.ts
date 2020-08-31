import { BitmapFilter } from "./BitmapFilter";
import { BlurFilter as RenderBlurFilter } from "../../../internal/render/filters/BlurFilter";

export class BlurFilter extends BitmapFilter {
  readonly __filter = new RenderBlurFilter();

  get blurX() {
    return this.__filter.blurX;
  }
  set blurX(value) {
    this.__filter.blurX = value;
  }

  get blurY() {
    return this.__filter.blurY;
  }
  set blurY(value) {
    this.__filter.blurY = value;
  }

  get quality() {
    return this.__filter.passes;
  }
  set quality(value) {
    this.__filter.passes = value;
  }

  constructor(blurX = 4.0, blurY = 4.0, quality = 1) {
    super();
    this.blurX = blurX;
    this.blurY = blurY;
  }
}
