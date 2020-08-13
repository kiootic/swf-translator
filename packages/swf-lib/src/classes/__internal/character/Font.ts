import { ShapeCharacter } from "./Shape";

export interface FontCharacter {
  name: string;
  isItalic: boolean;
  isBold: boolean;
  glyphs: FontGlyph[];
  layout?: FontLayout;
}

export interface FontGlyph {
  char?: string;
  shape: ShapeCharacter;
}

export interface FontLayout {
  ascent: number;
  descent: number;
  leading: number;
  advances: number[];
}
