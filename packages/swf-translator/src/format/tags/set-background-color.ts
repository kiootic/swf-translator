import { Tag } from "../tag";
import { Reader } from "../../binary";
import { RGB, rgb } from "../structs";

export class SetBackgroundColorTag extends Tag {
  static readonly code = 9;

  constructor(reader: Reader) {
    super();
    this.backgroundColor = rgb(reader);
  }

  readonly backgroundColor: RGB;
}
