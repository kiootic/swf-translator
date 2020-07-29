import { BitmapFilter } from "./BitmapFilter";
import { DropShadowFilter as RenderDropShadowFilter } from "../../../internal/render/filters/DropShadowFilter";
import { RenderTarget } from "../../../internal/render/RenderTarget";
import { RenderContext } from "../../../internal/render/RenderContext";

export class DropShadowFilter extends BitmapFilter {
  private filter = new RenderDropShadowFilter();

  color = 0xffffffff;
  blurX = 0;
  blurY = 0;
  quality = 1;
  strength = 1.0;
  alpha = 1.0;
  angle = 45.0;
  distance = 4.0;
  hideObject = false;
  inner = false;
  knockout = false;

  get __padX() {
    this.syncValues();
    return this.filter.padX;
  }
  get __padY() {
    this.syncValues();
    return this.filter.padY;
  }

  private syncValues() {
    this.filter.color = this.color;
    this.filter.blurX = this.blurX;
    this.filter.blurY = this.blurY;
    this.filter.passes = this.quality;
    this.filter.strength = this.strength;
    this.filter.angle = this.angle;
    this.filter.distance = this.distance;
  }

  __apply(target: RenderTarget, ctx: RenderContext) {
    this.syncValues();
    ctx.renderer.applyFilter(target, this.filter);
  }
}
