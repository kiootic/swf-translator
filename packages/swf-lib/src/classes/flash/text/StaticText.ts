import { mat2d } from "gl-matrix";
import { autorun } from "mobx";
import { DisplayObject } from "../display/DisplayObject";
import { StaticTextInstance } from "../../../internal/character/StaticTextInstance";
import { RenderObjectSprite } from "../../../internal/render/objects/RenderObjectSprite";

export class StaticText extends DisplayObject {
  declare __character: StaticTextInstance | null;
  declare __renderObjects: RenderObjectSprite[];

  #updateRenderMatrix = autorun(() => {
    const matrix = this.transform.__worldMatrix.__value;
    for (const obj of this.__renderObjects) {
      mat2d.copy(obj.renderMatrix, matrix);
    }
  });
}
