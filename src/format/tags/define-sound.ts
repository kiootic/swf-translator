import { Tag } from "../tag";
import { Reader } from "../../binary";

export class DefineSoundTag extends Tag {
  static readonly code = 14;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();
    this.soundFormat = reader.nextBits(4);
    this.soundRate = reader.nextBits(2);
    this.soundSize = reader.nextBits(1);
    this.soundType = reader.nextBits(1);
    this.soundSampleCount = reader.nextUInt32();
    this.soundData = reader.nextBuffer(reader.length - reader.offset);
  }

  readonly characterId: number;
  readonly soundFormat: number;
  readonly soundRate: number;
  readonly soundSize: number;
  readonly soundType: number;
  readonly soundSampleCount: number;
  readonly soundData: Buffer;
}
