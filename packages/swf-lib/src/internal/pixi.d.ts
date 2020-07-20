import { DisplayObject as FlashDisplayObject } from "../classes/flash/display/DisplayObject";

declare module "pixi.js" {
  interface DisplayObject {
    __flash?: FlashDisplayObject;
  }
}
