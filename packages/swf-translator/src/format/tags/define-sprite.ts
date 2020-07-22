import { Tag } from "../tag";
import { Reader } from "../../binary";
import { parseTags } from ".";

export class DefineSpriteTag extends Tag {
  static readonly code = 39;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();
    this.frameCount = reader.nextUInt16();
    this.controlTags = parseTags(reader);
  }

  readonly characterId: number;
  readonly frameCount: number;
  readonly controlTags: Tag[];
}
