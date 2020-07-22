import { Tag } from "../tag";
import { Reader } from "../../binary";

export class ShowFrameTag extends Tag {
  static readonly code = 1;

  constructor(reader: Reader) {
    super();
  }
}
