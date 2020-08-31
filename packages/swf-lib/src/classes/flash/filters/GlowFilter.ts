import { BitmapFilter } from "./BitmapFilter";
import { DropShadowFilter as RenderDropShadowFilter } from "../../../internal/render/filters/DropShadowFilter";

export class GlowFilter extends BitmapFilter {
  readonly __filter = new RenderDropShadowFilter();

  alpha: number;
  inner: boolean;

  get color() {
    return this.__filter.color;
  }
  set color(value) {
    this.__filter.color = value;
  }

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

  get strength() {
    return this.__filter.strength;
  }
  set strength(value) {
    this.__filter.strength = value;
  }

  get knockout() {
    return this.__filter.knockout;
  }
  set knockout(value) {
    this.__filter.knockout = value;
  }

  constructor(
    color = 0xff0000,
    alpha = 1.0,
    blurX = 6.0,
    blurY = 6.0,
    strength = 2,
    quality = 1,
    inner = false,
    knockout = false
  ) {
    super();
    this.color = color;
    this.alpha = alpha;
    this.blurX = blurX;
    this.blurY = blurY;
    this.strength = strength;
    this.quality = quality;
    this.inner = inner;
    this.knockout = knockout;
  }
}
