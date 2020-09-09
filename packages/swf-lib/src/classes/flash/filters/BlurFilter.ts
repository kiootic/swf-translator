import { BitmapFilter } from "./BitmapFilter";
import {
  BlurFilterInstance,
  BlurFilter as RenderBlurFilter,
} from "../../../internal/render2/filter/BlurFilter";

export class BlurFilter extends BitmapFilter {
  get __filter(): BlurFilterInstance {
    return {
      filter: RenderBlurFilter.instance,
      padX: this.blurX,
      padY: this.blurY,
      blurX: this.blurX,
      blurY: this.blurY,
      passes: this.quality,
    };
  }

  constructor(public blurX = 4.0, public blurY = 4.0, public quality = 1) {
    super();
  }
}
