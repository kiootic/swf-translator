import { RenderTarget } from "../../../internal/render/RenderTarget";
import { RenderContext } from "../../../internal/render/RenderContext";

export class BitmapFilter {
  get __padX() {
    return 0;
  }
  get __padY() {
    return 0;
  }

  __apply(target: RenderTarget, ctx: RenderContext) {}
}
