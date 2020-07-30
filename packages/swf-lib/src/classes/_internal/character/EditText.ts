import { Rect } from "./primitives";

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
  align?: number;
  leftMargin?: number;
  rightMargin?: number;
  indent?: number;
  leading?: number;
  variableName?: string;
  initialText?: string;
}
