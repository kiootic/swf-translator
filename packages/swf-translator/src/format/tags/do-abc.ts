import { Tag } from "../tag";
import { Reader } from "../../binary";

export class DoABCTag extends Tag {
  static readonly code = 82;

  constructor(reader: Reader) {
    super();
    this.flags = reader.nextUInt32();
    this.name = reader.nextString();
    this.abcData = reader.nextBuffer(reader.length - reader.offset);
  }

  readonly flags: number;
  readonly name: string;
  readonly abcData: Buffer;
}
