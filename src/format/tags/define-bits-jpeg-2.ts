import { Tag } from "../tag";
import { Reader } from "../../binary";

export class DefineBitsJPEG2Tag extends Tag {
  static readonly code = 21;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();
    this.imageData = reader.nextBuffer(reader.length - reader.offset);
  }

  readonly characterId: number;
  readonly imageData: Buffer;
}
