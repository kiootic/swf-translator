import { Tag } from "../tag";
import { Reader } from "../../binary";
import { buttonRecordList, ButtonRecord } from "../structs";

export class DefineButton2Tag extends Tag {
  static readonly code = 34;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();
    reader.nextBits(7);
    this.trackAsMenu = reader.nextBitBool();

    const actionOffset = reader.nextUInt16();
    if (actionOffset !== 0) {
      throw new Error("Button actions are unsupported");
    }

    this.records = buttonRecordList(2)(reader);
  }

  readonly characterId: number;
  readonly trackAsMenu: boolean;
  readonly records: ButtonRecord[];
}
