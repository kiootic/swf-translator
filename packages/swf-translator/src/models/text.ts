import { Shape } from "./shape";
import { Matrix, Rect } from "./primitives";

export interface Font {
  name: string;
  glyphs: FontGlyph[];
  layout?: FontLayout;
}

export interface FontGlyph {
  char?: string;
  shape: Shape;
}

export interface FontLayout {
  ascent: number;
  descent: number;
  leading: number;
  advances: number[];
}

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
