import { Rect } from "./primitives";
import { FillStyle } from "./styles";

export interface ShapeCharacter {
  bounds: Rect;
  contours: ShapeContour[];
}

export interface ShapeContour {
  fill: FillStyle;
  vertices: number[];
  indices: number[];
}
