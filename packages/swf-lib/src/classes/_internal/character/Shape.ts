import { FillStyle } from "./styles";

export interface Shape {
  contours: ShapeContour[];
}

export interface ShapeContour {
  fill: FillStyle;
  vertices: number[];
  indices: number[];
}
