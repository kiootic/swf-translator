import { Tag } from "../tag";
import { Reader } from "../../binary";

export class RemoveObject2Tag extends Tag {
  static readonly code = 28;

  constructor(reader: Reader) {
    super();
    this.depth = reader.nextUInt16();
  }

  readonly depth: number;
}
