import { DisplayObject } from "./DisplayObject";
import { BitmapData } from "./BitmapData";

export class Bitmap extends DisplayObject {
  constructor(readonly bitmapData: BitmapData) {
    super();
  }
}
