import { Tag } from "../tag";
import { Reader } from "../../binary";
import { rect, Rect, ShapeWithStyle, shapeWithStyle } from "../structs";

export class DefineShape2Tag extends Tag {
  static readonly code = 22;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();
    this.shapeBounds = rect(reader);
    this.shapes = shapeWithStyle(2)(reader);
  }

  readonly characterId: number;
  readonly shapeBounds: Rect;
  readonly shapes: ShapeWithStyle;
}
