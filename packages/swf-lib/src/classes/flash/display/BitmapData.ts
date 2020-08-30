import { DisplayObject } from "./DisplayObject";
import { Matrix } from "../geom/Matrix";
import { ColorTransform } from "../geom/ColorTransform";
import { Rectangle } from "../geom/Rectangle";
import { Point } from "../geom/Point";

export class BitmapData {
  constructor(
    readonly width: number,
    readonly height: number,
    readonly transparent = true,
    readonly fillColor = 0xffffffff
  ) {}

  draw(
    source: DisplayObject,
    matrix?: Matrix,
    colorTransform?: ColorTransform,
    blendMode?: String
  ) {}

  getPixel32(x: number, y: number) {
    return 0;
  }

  dispose() {}

  colorTransform(rect: Rectangle, trx: ColorTransform) {}

  lock() {}

  unlock() {}

  copyPixels(
    sourceBitmapData: BitmapData,
    sourceRect: Rectangle,
    destPoint: Point
  ) {}

  scroll(x: number, y: number) {}
}
