import { BitmapFilter } from "./BitmapFilter";
import { DropShadowFilter as RenderDropShadowFilter } from "../../../internal/render/filters/DropShadowFilter";

export class DropShadowFilter extends BitmapFilter {
  readonly __filter = new RenderDropShadowFilter();

  hideObject = false;
  inner = false;

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

  get angle() {
    return this.__filter.angle;
  }
  set angle(value) {
    this.__filter.angle = value;
  }

  get distance() {
    return this.__filter.distance;
  }
  set distance(value) {
    this.__filter.distance = value;
  }

  get knockout() {
    return this.__filter.knockout;
  }
  set knockout(value) {
    this.__filter.knockout = value;
  }
}
