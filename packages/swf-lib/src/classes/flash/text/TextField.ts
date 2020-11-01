import { Container } from "../../__internal/text/Container";
import { SceneNode } from "../../../internal/render2/SceneNode";
import { InteractiveObject } from "../display/InteractiveObject";
import { EditTextInstance } from "../../../internal/character/EditTextInstance";
import { TextFieldType } from "./TextFieldType";

export class TextField extends InteractiveObject {
  static __character?: EditTextInstance;

  declare __character: EditTextInstance | null;

  __internalNode = new SceneNode(null);

  constructor() {
    super();

    this.__character =
      (this.constructor as typeof TextField).__character ?? null;
    this.__character?.applyTo(this);

    this.__internalNode.setParent(this.__node, 0);
  }

  readonly __container = new Container(this.__internalNode);

  type: TextFieldType = TextFieldType.DYNAMIC;

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
    this.__container.text = value;
  }

  get htmlText() {
    return this.__container.htmlText;
  }
  set htmlText(value) {
    this.__container.htmlText = value;
  }

  __onRender() {
    super.__onRender();
    const layoutScale =
      this.__node.transformWorld[0] / this.__node.transformWorld[3];
    if (this.__container.layoutScale !== layoutScale) {
      this.__container.layoutScale = layoutScale;
      this.__internalNode.transformLocal[0] = 1 / layoutScale;
      this.__container.layout();
    }
  }
}
