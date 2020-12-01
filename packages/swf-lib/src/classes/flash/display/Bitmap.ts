import { DisplayObject } from "./DisplayObject";
import { BitmapData } from "./BitmapData";
import { RenderObject } from "../../../internal/render2/RenderObject";
import { rect } from "../../../internal/math/rect";
import { Texture } from "../../../internal/render2/gl/Texture";
import { TWIPS } from "../../../internal/twips";

export class Bitmap extends DisplayObject {
  constructor(public bitmapData: BitmapData) {
    super();

    const { width, height } = this.bitmapData;
    const bounds = rect.fromValues(0, 0, width, height);
    this.__node.setRenderObjects(
      [
        RenderObject.rect(bounds, Texture.WHITE, {
          texWidth: width,
          texHeight: height,
          scale: TWIPS,
          invertY: true,
        }),
      ],
      bounds
    );
  }

  __onRender() {
    super.__onRender();

    this.bitmapData.__render();
    if (this.bitmapData.__target) {
      this.__node.renderObjects[0].texture = this.bitmapData.__target.texture;
    }
  }
}
