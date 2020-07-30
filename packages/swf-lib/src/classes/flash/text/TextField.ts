import { mat2d, vec4 } from "gl-matrix";
import { autorun, observable } from "mobx";
import { InteractiveObject } from "../display/InteractiveObject";
import { EditTextInstance } from "../../../internal/character/EditTextInstance";
import { RenderObjectSprite } from "../../../internal/render/objects/RenderObjectSprite";
import { TextFieldType } from "./TextFieldType";
import { TextFormat } from "./TextFormat";

export class TextField extends InteractiveObject {
  declare __character: EditTextInstance | null;
  declare __renderObjects: RenderObjectSprite[];

  @observable
  wordWrap = false;

  @observable
  multiline = false;

  @observable
  type: TextFieldType = TextFieldType.DYNAMIC;

  @observable
  selectable = true;

  @observable
  defaultTextFormat = new TextFormat();

  get textColor() {
    return this.defaultTextFormat.color;
  }
  set textColor(value) {
    this.defaultTextFormat.color = value;
  }

  @observable
  text = "";

  @observable
  htmlText = "";

  #updateRenderMatrix = autorun(() => {
    const matrix = this.transform.__worldMatrix.__value;
    const colorTransform = this.transform.__worldColorTransform;
    for (const obj of this.__renderObjects) {
      mat2d.copy(obj.renderMatrix, matrix);
      vec4.copy(obj.colorMul, colorTransform.__mul);
      vec4.copy(obj.colorAdd, colorTransform.__add);
    }
  });
}
