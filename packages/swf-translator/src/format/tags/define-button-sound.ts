import { Tag } from "../tag";
import { Reader, Parser } from "../../binary";
import { SoundInfo, soundInfo } from "../structs/sound";

export interface ButtonSound {
  characterId: number;
  soundInfo: SoundInfo;
}

const buttonSound: Parser<ButtonSound | undefined> = (reader) => {
  const characterId = reader.nextUInt16();
  if (characterId === 0) {
    return undefined;
  }

  return {
    characterId,
    soundInfo: soundInfo(reader),
  };
};

export class DefineButtonSoundTag extends Tag {
  static readonly code = 17;

  constructor(reader: Reader) {
    super();
    this.buttonId = reader.nextUInt16();
    this.overUpToIdle = buttonSound(reader);
    this.idleToOverUp = buttonSound(reader);
    this.overUpToOverDown = buttonSound(reader);
    this.overDownToOverUp = buttonSound(reader);
  }

  readonly buttonId: number;
  readonly overUpToIdle?: ButtonSound;
  readonly idleToOverUp?: ButtonSound;
  readonly overUpToOverDown?: ButtonSound;
  readonly overDownToOverUp?: ButtonSound;
}
