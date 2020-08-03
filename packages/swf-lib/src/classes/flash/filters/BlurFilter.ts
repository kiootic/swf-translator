import { BitmapFilter } from "./BitmapFilter";
import { BlurFilter as RenderBlurFilter } from "../../../internal/render/filters/BlurFilter";
import { RenderTarget } from "../../../internal/render/RenderTarget";
import { RenderContext } from "../../../internal/render/RenderContext";

export class BlurFilter extends BitmapFilter {
  private filter = new RenderBlurFilter();

  blurX = 0;
  blurY = 0;
  quality = 1;

  get __padX() {
    this.syncValues();
    return this.filter.padX;
  }
  get __padY() {
    this.syncValues();
    return this.filter.padY;
  }

  private syncValues() {
    this.filter.blurX = this.blurX;
    this.filter.blurY = this.blurY;
    this.filter.passes = this.quality;
  }

  __apply(target: RenderTarget, ctx: RenderContext) {
    this.syncValues();
    ctx.renderer.applyFilter(target, this.filter);
  }
}
