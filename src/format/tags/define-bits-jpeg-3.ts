import { Tag } from "../tag";
import { Reader } from "../../binary";
import { inflateSync } from "zlib";

export class DefineBitsJPEG3Tag extends Tag {
  static readonly code = 35;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();
    const imageDataLength = reader.nextUInt32();
    this.imageData = reader.nextBuffer(imageDataLength);
    const zlibData = reader.nextBuffer(reader.length - reader.offset);
    this.alphaBitmapData = inflateSync(zlibData);
  }

  readonly characterId: number;
  readonly imageData: Buffer;
  readonly alphaBitmapData: Buffer;
}
