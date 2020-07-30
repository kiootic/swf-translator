import { observable } from "mobx";
import { TextFormatAlign } from "./TextFormatAlign";

export class TextFormat {
  @observable align: TextFormatAlign = TextFormatAlign.LEFT;
  @observable bold = false;
  @observable italic = false;
  @observable color = 0x000000;
  @observable font = "Times New Roman";
  @observable size = 12;
  @observable leading = 0;
}
