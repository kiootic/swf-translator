import { mat2d, vec4 } from "gl-matrix";
import { autorun, observable, runInAction } from "mobx";
import { Container } from "../../_internal/text/Container";
import { InteractiveObject } from "../display/InteractiveObject";
import { EditTextInstance } from "../../../internal/character/EditTextInstance";
import { RenderObjectSprite } from "../../../internal/render/objects/RenderObjectSprite";
import { TextFieldType } from "./TextFieldType";
import { rect } from "../../../internal/math/rect";

export class TextField extends InteractiveObject {
  declare __character: EditTextInstance | null;
  declare __renderObjects: RenderObjectSprite[];

  readonly __container = new Container();

  @observable
  __dirtyRender = false;

  @observable
  type: TextFieldType = TextFieldType.DYNAMIC;

  @observable
  selectable = true;

  get wordWrap() {
    return this.__container.wordWrap;
  }
  set wordWrap(value) {
    this.__container.wordWrap = value;
  }

  get multiline() {
    return this.__container.multiline;
  }
  set multiline(value) {
    this.__container.multiline = value;
  }

  get defaultTextFormat() {
    return this.__container.defaultTextFormat;
  }
  set defaultTextFormat(value) {
    this.__container.defaultTextFormat = value;
  }

  get textColor() {
    return this.__container.defaultTextFormat.color;
  }
  set textColor(value) {
    this.__container.defaultTextFormat.color = value;
  }

  get text() {
    return this.__container.text;
  }
  set text(value) {
    this.__container.setText(value);
  }

  get htmlText() {
    return this.__container.htmlText;
  }
  set htmlText(value) {
    this.__container.setHTMLText(value);
  }

  #copyBounds = autorun(() => {
    this.__container.bounds = rect.copy(rect.create(), this.__bounds.__rect);
  });

  #copyRenderObjects = autorun(() => {
    this.__renderObjects = this.__container.renderObjects;
    this.__dirtyRender = true;
  });

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
}
