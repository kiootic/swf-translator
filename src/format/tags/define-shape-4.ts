import { Tag } from "../tag";
import { Reader } from "../../binary";
import { rect, Rect, ShapeWithStyle, shapeWithStyle } from "../structs";

export class DefineShape4Tag extends Tag {
  static readonly code = 83;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();
    this.shapeBounds = rect(reader);
    this.edgeBounds = rect(reader);
    reader.nextBits(5);
    this.usesFillWindingRule = reader.nextBitBool();
    this.usesNonScalingStrokes = reader.nextBitBool();
    this.usesScalingStrokes = reader.nextBitBool();
    this.shapes = shapeWithStyle(4)(reader);
  }

  readonly characterId: number;
  readonly shapeBounds: Rect;
  readonly edgeBounds: Rect;
  readonly usesFillWindingRule: boolean;
  readonly usesNonScalingStrokes: boolean;
  readonly usesScalingStrokes: boolean;
  readonly shapes: ShapeWithStyle;
}
