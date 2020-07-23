import { Tag } from "../tag";
import { Reader } from "../../binary";
import {
  TextRecord,
  textRecords,
  Rect,
  Matrix,
  matrix,
  rect,
} from "../structs";

export class DefineTextTag extends Tag {
  static readonly code = 11;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();

    this.textBounds = rect(reader);
    this.textMatrix = matrix(reader);
    this.textRecords = textRecords(1)(reader);
  }

  readonly characterId: number;
  readonly textBounds: Rect;
  readonly textMatrix: Matrix;
  readonly textRecords: TextRecord[];
}
