import { Tag } from "../tag";
import { Reader } from "../../binary";
import { ARGB, argb } from "../structs";
import { inflateSync } from "zlib";

export class DefineBitsLossless2Tag extends Tag {
  static readonly code = 36;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();
    this.bitmapFormat = reader.nextUInt8();
    if (this.bitmapFormat !== 5) {
      throw new Error(`Unsupported bitmap format: ${this.bitmapFormat}`);
    }

    this.bitmapWidth = reader.nextUInt16();
    this.bitmapHeight = reader.nextUInt16();
    const numPixels = this.bitmapWidth * this.bitmapHeight;

    const zlibData = reader.nextBuffer(reader.length - reader.offset);
    const data = inflateSync(zlibData);
    const dataReader = new Reader(data);
    this.bitmapData = new Array(numPixels);
    for (let i = 0; i < numPixels; i++) {
      this.bitmapData[i] = argb(dataReader);
    }
  }

  readonly characterId: number;
  readonly bitmapFormat: number;
  readonly bitmapWidth: number;
  readonly bitmapHeight: number;
  readonly bitmapData: ARGB[];
}
