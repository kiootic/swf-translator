import { FillStyle } from "./styles";

export interface Shape {
  contours: ShapeContour[];
}

interface ShapeContour {
  fill: FillStyle;
  vertices: number[];
  indices: number[];
}
