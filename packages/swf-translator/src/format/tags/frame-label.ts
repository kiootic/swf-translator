import { Tag } from "../tag";
import { Reader } from "../../binary";

export class FrameLabelTag extends Tag {
  static readonly code = 43;

  constructor(reader: Reader) {
    super();
    this.name = reader.nextString();
  }

  readonly name: string;
}
