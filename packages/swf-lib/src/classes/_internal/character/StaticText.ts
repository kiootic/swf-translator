import { Matrix } from "./primitives";

export interface StaticText {
  matrix: Matrix;
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
