import { DisplayObject } from "./DisplayObject";
import { BitmapData } from "./BitmapData";
import { RenderObject } from "../../../internal/render2/RenderObject";
import { rect } from "../../../internal/math/rect";

export class Bitmap extends DisplayObject {
  constructor(readonly bitmapData: BitmapData) {
    super();
  }

  __onFrameEnter() {
    if (this.__node.renderObjects.length === 0) {
      this.bitmapData.__render();
      const bounds = rect.fromValues(
        0,
        0,
        this.bitmapData.width,
        this.bitmapData.height
      );
      this.__node.setRenderObjects(
        [RenderObject.rect(bounds, this.bitmapData.__target!.texture, true)],
        bounds
      );
    }
    super.__onFrameEnter();
  }

  __onFrameExit() {
    this.bitmapData.__render();
    super.__onFrameExit();
  }
}
