import { Tag } from "../tag";
import { Reader } from "../../binary";

export class DefineBitsTag extends Tag {
  static readonly code = 6;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();
    this.jpegData = reader.nextBuffer(reader.length - reader.offset);
  }

  readonly characterId: number;
  readonly jpegData: Buffer;
}
