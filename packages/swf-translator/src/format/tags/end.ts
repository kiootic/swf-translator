import { Tag } from "../tag";
import { Reader } from "../../binary";

export class EndTag extends Tag {
  static readonly code = 0;

  constructor(reader: Reader) {
    super();
  }
}
