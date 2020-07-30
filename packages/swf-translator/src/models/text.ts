import { Shape } from "./shape";
import { Matrix, Rect } from "./primitives";

export interface Font {
  name: string;
  isItalic: boolean;
  isBold: boolean;
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

export interface EditText {
  bounds: Rect;

  isWordWrap: boolean;
  isMultiline: boolean;
  isPassword: boolean;
  isReadonly: boolean;
  isAutoSize: boolean;
  noSelect: boolean;
  border: boolean;
  wasStatic: boolean;
  isHTML: boolean;
  useOutlines: boolean;

  fontID?: number;
  fontHeight?: number;
  textColor?: number;
  maxLength?: number;
  align?: number;
  leftMargin?: number;
  rightMargin?: number;
  indent?: number;
  leading?: number;
  variableName?: string;
  initialText?: string;
}
