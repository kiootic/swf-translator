import { Tag } from "../tag";
import { Reader } from "../../binary";
import { rect, Rect, ShapeWithStyle, shapeWithStyle } from "../structs";

export class DefineShapeTag extends Tag {
  static readonly code = 2;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();
    this.shapeBounds = rect(reader);
    this.shapes = shapeWithStyle(1)(reader);
  }

  readonly characterId: number;
  readonly shapeBounds: Rect;
  readonly shapes: ShapeWithStyle;
}
