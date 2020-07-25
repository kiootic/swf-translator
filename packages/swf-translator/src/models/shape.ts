import { Rect } from "./primitives";
import { FillStyle } from "./styles";

export interface Shape {
  contours: ShapeContour[];
  bounds: Rect;
}

export interface ShapeContour {
  fill: FillStyle;
  vertices: number[];
  indices: number[];
}
