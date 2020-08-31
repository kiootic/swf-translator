import { TextFormatAlign } from "./TextFormatAlign";

export class TextFormat {
  align: TextFormatAlign = TextFormatAlign.LEFT;
  bold = false;
  italic = false;
  color = 0x000000;
  font = "Times New Roman";
  size = 12;
  leading = 0;

  __clone() {
    const format = new TextFormat();
    format.align = this.align;
    format.bold = this.bold;
    format.italic = this.italic;
    format.color = this.color;
    format.font = this.font;
    format.size = this.size;
    format.leading = this.leading;
    return format;
  }
}
