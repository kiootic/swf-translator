import { BitmapFilter } from "./BitmapFilter";
import { DropShadowFilter as RenderDropShadowFilter } from "../../../internal/render/filters/DropShadowFilter";
import { RenderTarget } from "../../../internal/render/RenderTarget";
import { RenderContext } from "../../../internal/render/RenderContext";

export class GlowFilter extends BitmapFilter {
  private filter = new RenderDropShadowFilter();

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
    this.filter.knockout = this.knockout;
  }

  __apply(target: RenderTarget, ctx: RenderContext) {
    this.syncValues();
    ctx.renderer.applyFilter(target, this.filter);
  }
}
