import { mat2d, vec4 } from "gl-matrix";
import { autorun, observable } from "mobx";
import { DisplayObject } from "./DisplayObject";
import { MorphShapeInstance } from "../../../internal/character/MorphShapeInstance";
import { RenderObjectSprite } from "../../../internal/render/objects/RenderObjectSprite";

export class MorphShape extends DisplayObject {
  declare __character: MorphShapeInstance | null;
  declare __renderObjects: RenderObjectSprite[];

  @observable
  __ratio = 0;

  @observable
  __dirtyRender = false;

  #updateRenderMatrix = autorun(() => {
    if (this.__dirtyRender) {
      this.__dirtyRender = false;
    }

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
