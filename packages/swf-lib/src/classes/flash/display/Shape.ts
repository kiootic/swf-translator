import { mat2d, vec4 } from "gl-matrix";
import { autorun } from "mobx";
import { DisplayObject } from "./DisplayObject";
import { ShapeInstance } from "../../../internal/character/ShapeInstance";
import { RenderObjectSprite } from "../../../internal/render/objects/RenderObjectSprite";

export class Shape extends DisplayObject {
  static __character?: ShapeInstance;

  declare __character: ShapeInstance | null;
  declare __renderObjects: RenderObjectSprite[];

  constructor() {
    super();

    this.__character = (this.constructor as typeof Shape).__character ?? null;
    this.__character?.applyTo(this);
  }

  #updateRenderMatrix = autorun(() => {
    const matrix = this.transform.__worldMatrix.__value;
    const colorTransform = this.transform.__worldColorTransform;
    for (const obj of this.__renderObjects) {
      mat2d.copy(obj.renderMatrix, matrix);
      vec4.copy(obj.colorMul, colorTransform.__mul);
      vec4.copy(obj.colorAdd, colorTransform.__add);
    }
  });

  hitTestPoint(x: number, y: number, shapeFlag?: boolean) {
    if (!super.hitTestPoint(x, y, shapeFlag)) {
      return false;
    }
    if (shapeFlag && this.__renderObjects.every((obj) => !obj.hitTest(x, y))) {
      return false;
    }
    return true;
  }
}
