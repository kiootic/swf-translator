import { FillStyle } from "./styles";

export interface Shape {
  readonly contours: ShapeContour[];
}

export interface ShapeContour {
  fill: FillStyle;
  vertices: number[];
  indices: number[];
}
