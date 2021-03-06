import { EditTextCharacter } from "../../classes/__internal/character";
import { TextField } from "../../classes/flash/text/TextField";
import { rect } from "../math/rect";
import { CharacterInstance } from "./CharacterInstance";
import { TextFieldType, TextFormatAlign } from "../../classes/flash/text";
import { AssetLibrary } from "../../classes/__internal";

export class EditTextInstance implements CharacterInstance {
  readonly def: EditTextCharacter;
  readonly layoutBounds: rect;

  constructor(
    readonly id: number,
    text: EditTextCharacter,
    readonly lib: AssetLibrary
  ) {
    this.def = {
      ...text,
      fontHeight: text.fontHeight && text.fontHeight / 20,
      leftMargin: text.leftMargin && text.leftMargin / 20,
      rightMargin: text.rightMargin && text.rightMargin / 20,
      indent: text.indent && text.indent / 20,
      leading: text.leading && text.leading / 20,
    };
    this.layoutBounds = rect.fromValues(...text.bounds);
  }

  applyTo(textField: TextField) {
    textField.wordWrap = this.def.isWordWrap;
    textField.multiline = this.def.isMultiline;
    textField.type = this.def.isReadonly
      ? TextFieldType.DYNAMIC
      : TextFieldType.INPUT;
    textField.selectable = !this.def.noSelect;
    rect.copy(textField.__container.layoutBounds, this.layoutBounds);

    switch (this.def.align) {
      case 0:
        textField.defaultTextFormat.align = TextFormatAlign.LEFT;
        break;
      case 1:
        textField.defaultTextFormat.align = TextFormatAlign.RIGHT;
        break;
      case 2:
        textField.defaultTextFormat.align = TextFormatAlign.CENTER;
        break;
      case 3:
        textField.defaultTextFormat.align = TextFormatAlign.JUSTIFY;
        break;
    }
    if (this.def.textColor != null) {
      textField.defaultTextFormat.color = this.def.textColor;
    }
    if (this.def.fontID != null) {
      textField.defaultTextFormat.font = this.lib.resolveFont(
        this.def.fontID
      ).font.name;
    }
    if (this.def.fontHeight != null) {
      textField.defaultTextFormat.size = this.def.fontHeight;
    }
    if (this.def.leading != null) {
      textField.defaultTextFormat.leading = this.def.leading;
    }

    if (this.def.isHTML) {
      textField.htmlText = this.def.initialText ?? "";
    } else {
      textField.text = this.def.initialText ?? "";
    }
  }
}
