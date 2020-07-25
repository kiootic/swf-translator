import { mat2d } from "gl-matrix";
import { autorun } from "mobx";
import { DisplayObject } from "./DisplayObject";
import { ShapeInstance } from "../../../internal/character/ShapeInstance";
import { RenderObjectSprite } from "../../../internal/render/objects/RenderObjectSprite";

export class Shape extends DisplayObject {
  declare __character: ShapeInstance | null;
  declare __renderObjects: RenderObjectSprite[];

  #updateRenderMatrix = autorun(() => {
    const matrix = this.transform.__worldMatrix.__value;
    for (const obj of this.__renderObjects) {
      mat2d.copy(obj.renderMatrix, matrix);
    }
  });
}
