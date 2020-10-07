import { Tag } from "../tag";
import { Reader } from "../../binary";
import { SoundInfo, soundInfo } from "../structs/sound";

export class StartSoundTag extends Tag {
  static readonly code = 15;

  constructor(reader: Reader) {
    super();
    this.soundId = reader.nextUInt16();
    this.soundInfo = soundInfo(reader);
  }

  readonly soundId: number;
  readonly soundInfo: SoundInfo;
}
