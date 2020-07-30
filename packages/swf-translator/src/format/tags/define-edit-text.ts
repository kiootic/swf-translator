import { Tag } from "../tag";
import { Reader } from "../../binary";
import {
  TextRecord,
  textRecords,
  Rect,
  Matrix,
  matrix,
  rect,
  RGBA,
  rgba,
} from "../structs";

export class DefineEditTextTag extends Tag {
  static readonly code = 37;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();

    this.bounds = rect(reader);

    const hasText = reader.nextBitBool();
    this.isWordWrap = reader.nextBitBool();
    this.isMultiline = reader.nextBitBool();
    this.isPassword = reader.nextBitBool();
    this.isReadonly = reader.nextBitBool();
    const hasTextColor = reader.nextBitBool();
    const hasMaxLength = reader.nextBitBool();
    const hasFont = reader.nextBitBool();

    const hasFontClass = reader.nextBitBool();
    this.isAutoSize = reader.nextBitBool();
    const hasLayout = reader.nextBitBool();
    this.noSelect = reader.nextBitBool();
    this.border = reader.nextBitBool();
    this.wasStatic = reader.nextBitBool();
    this.isHTML = reader.nextBitBool();
    this.useOutlines = reader.nextBitBool();

    if (hasFont) {
      this.fontID = reader.nextUInt16();
    }
    if (hasFontClass) {
      throw new Error("Font class is not supported");
    }
    if (hasFont) {
      this.fontHeight = reader.nextUInt16();
    }
    if (hasTextColor) {
      this.textColor = rgba(reader);
    }
    if (hasMaxLength) {
      this.maxLength = reader.nextUInt16();
    }
    if (hasLayout) {
      this.align = reader.nextUInt8();
      this.leftMargin = reader.nextUInt16();
      this.rightMargin = reader.nextUInt16();
      this.indent = reader.nextUInt16();
      this.leading = reader.nextInt16();
    }
    this.variableName = reader.nextString();
    if (hasText) {
      this.initialText = reader.nextString();
    }
  }

  readonly characterId: number;
  readonly bounds: Rect;

  readonly isWordWrap: boolean;
  readonly isMultiline: boolean;
  readonly isPassword: boolean;
  readonly isReadonly: boolean;
  readonly isAutoSize: boolean;
  readonly noSelect: boolean;
  readonly border: boolean;
  readonly wasStatic: boolean;
  readonly isHTML: boolean;
  readonly useOutlines: boolean;

  readonly fontID?: number;
  readonly fontHeight?: number;
  readonly textColor?: RGBA;
  readonly maxLength?: number;
  readonly align?: number;
  readonly leftMargin?: number;
  readonly rightMargin?: number;
  readonly indent?: number;
  readonly leading?: number;
  readonly variableName: string;
  readonly initialText?: string;
}
