import { Tag } from "../tag";
import { Reader } from "../../binary";
import { rect, Rect, ShapeWithStyle, shapeWithStyle } from "../structs";

export class DefineShape3Tag extends Tag {
  static readonly code = 32;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();
    this.shapeBounds = rect(reader);
    this.shapes = shapeWithStyle(3)(reader);
  }

  readonly characterId: number;
  readonly shapeBounds: Rect;
  readonly shapes: ShapeWithStyle;
}
