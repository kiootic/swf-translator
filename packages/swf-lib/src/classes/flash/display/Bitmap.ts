import { DisplayObject } from "./DisplayObject";
import { BitmapData } from "./BitmapData";
import { RenderObject } from "../../../internal/render2/RenderObject";
import { rect } from "../../../internal/math/rect";
import { Texture } from "../../../internal/render2/gl/Texture";

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
      if (this.bitmapData.__target) {
        this.__node.setRenderObjects(
          [RenderObject.rect(bounds, this.bitmapData.__target!.texture, true)],
          bounds
        );
      }
    }
    super.__onFrameEnter();
  }

  __onFrameExit() {
    this.bitmapData.__render();
    if (this.__node.renderObjects.length > 0) {
      this.__node.renderObjects[0].texture = this.bitmapData.__target!.texture;
    }
    super.__onFrameExit();
  }
}
