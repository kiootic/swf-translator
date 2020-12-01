import { AVMObject } from "../../__internal/avm2/AVMObject";
import { SceneNode } from "../../../internal/render2/SceneNode";
import { preMultiplyAlpha } from "../../../internal/math/color";
import { RenderObject } from "../../../internal/render2/RenderObject";
import { rect } from "../../../internal/math/rect";
import { pixelToTwips } from "../../../internal/twips";

export class Graphics extends AVMObject {
  private __x = 0;
  private __y = 0;
  private __lineThickness = -1;
  private __lineColor = 0xff000000;
  private readonly __bounds = rect.create();
  private readonly __renderObjects: RenderObject[] = [];

  constructor(readonly __node: SceneNode) {
    super();
  }

  clear() {
    this.__x = 0;
    this.__y = 0;
    this.__lineThickness = -1;
    this.__lineColor = 0xff000000;
    rect.clear(this.__bounds);
    this.__renderObjects.length = 0;
    this.__node.setRenderObjects([], this.__bounds);
  }

  lineStyle(thickness = NaN, color = 0, alpha = 1.0) {
    this.__lineThickness = isNaN(thickness) ? -1 : thickness;
    this.__lineColor = preMultiplyAlpha(
      color + Math.floor(alpha * 0xff) * 0x1000000
    );
  }

  moveTo(x: number, y: number) {
    this.__x = x;
    this.__y = y;
  }

  lineTo(x: number, y: number) {
    const line = RenderObject.line(
      pixelToTwips(this.__x),
      pixelToTwips(this.__y),
      pixelToTwips(x),
      pixelToTwips(y),
      pixelToTwips(this.__lineThickness),
      this.__lineColor
    );
    this.__renderObjects.push(line);
    rect.union(this.__bounds, this.__bounds, line.bounds);
    this.__node.setRenderObjects(this.__renderObjects.slice(), this.__bounds);

    this.__x = x;
    this.__y = y;
  }
}
