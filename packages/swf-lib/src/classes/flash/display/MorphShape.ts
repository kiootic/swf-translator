import { mat2d, vec4 } from "gl-matrix";
import { autorun, observable } from "mobx";
import { DisplayObject } from "./DisplayObject";
import { MorphShapeInstance } from "../../../internal/character/MorphShapeInstance";
import { RenderObjectSprite } from "../../../internal/render/objects/RenderObjectSprite";

export class MorphShape extends DisplayObject {
  static __character?: MorphShapeInstance;

  declare __character: MorphShapeInstance | null;
  declare __renderObjects: RenderObjectSprite[];

  constructor() {
    super();

    this.__character =
      (this.constructor as typeof MorphShape).__character ?? null;
    this.__character?.applyTo(this);
  }

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
    return this.__renderObjects.some((obj) =>
      obj.hitTest(x, y, shapeFlag ?? false)
    );
  }
}
