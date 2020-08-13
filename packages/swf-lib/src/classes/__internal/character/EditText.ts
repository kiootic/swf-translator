import { Rect } from "./primitives";

export enum TextAlign {
  Left = 0,
  Right = 1,
  Center = 2,
  Justify = 3,
}

export interface EditTextCharacter {
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
  align?: TextAlign;
  leftMargin?: number;
  rightMargin?: number;
  indent?: number;
  leading?: number;
  variableName?: string;
  initialText?: string;
}
