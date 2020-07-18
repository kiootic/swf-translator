import { FillStyle, LineStyle } from "./styles";

export interface Shape {
  readonly commands: ShapeCommand[];
}

export enum ShapeCommandKind {
  MoveTo = 1,
  LineTo = 2,
  CurveTo = 3,
  Style = 4,
  EndPath = 5,
}

export type ShapeCommand =
  | ShapeCommandMoveTo
  | ShapeCommandLineTo
  | ShapeCommandCurveTo
  | ShapeCommandStyle
  | ShapeCommandEndPath;

export interface ShapeCommandMoveTo {
  kind: ShapeCommandKind.MoveTo;
  x: number;
  y: number;
}

export interface ShapeCommandLineTo {
  kind: ShapeCommandKind.LineTo;
  x: number;
  y: number;
}

export interface ShapeCommandCurveTo {
  kind: ShapeCommandKind.CurveTo;
  controlX: number;
  controlY: number;
  x: number;
  y: number;
}

export interface ShapeCommandStyle {
  kind: ShapeCommandKind.Style;
  fill: FillStyle | null;
  line: LineStyle | null;
}

export interface ShapeCommandEndPath {
  kind: ShapeCommandKind.EndPath;
}
