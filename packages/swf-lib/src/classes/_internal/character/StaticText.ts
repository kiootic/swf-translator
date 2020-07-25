import { Matrix, Rect } from "./primitives";

export interface StaticText {
  matrix: Matrix;
  bounds: Rect;
  glyphs: TextGlyph[];
}

export interface TextGlyph {
  fontId: number;
  color: number;
  x: number;
  y: number;
  size: number;

  index: number;
}
