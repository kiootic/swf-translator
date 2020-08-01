import { Tag } from "../tag";
import { Reader } from "../../binary";
import {
  rect,
  Rect,
  Shape,
  MorphFillStyle,
  MorphLineStyle,
  shape,
  morphFillStyleArray,
  morphLineStyleArray,
} from "../structs";

export class DefineMorphShapeTag extends Tag {
  static readonly code = 46;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();
    this.startBounds = rect(reader);
    this.endBounds = rect(reader);
    reader.nextUInt32();
    this.fillStyles = morphFillStyleArray(reader);
    this.lineStyles = morphLineStyleArray(1)(reader);
    this.startEdges = shape(2)(reader);
    this.endEdges = shape(2)(reader);
  }

  readonly characterId: number;
  readonly startBounds: Rect;
  readonly endBounds: Rect;
  readonly fillStyles: MorphFillStyle[];
  readonly lineStyles: MorphLineStyle[];
  readonly startEdges: Shape;
  readonly endEdges: Shape;
}
