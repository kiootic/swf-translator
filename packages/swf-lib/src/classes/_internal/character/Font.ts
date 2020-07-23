import { Shape } from "./Shape";

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
