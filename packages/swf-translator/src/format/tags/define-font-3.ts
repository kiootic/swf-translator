import { Tag } from "../tag";
import { Reader, uint32, uint16 } from "../../binary";
import { Shape, shape } from "../structs";

export class DefineFont3Tag extends Tag {
  static readonly code = 75;

  constructor(reader: Reader) {
    super();
    this.characterId = reader.nextUInt16();

    const hasLayout = reader.nextBitBool();
    const isShiftJIS = reader.nextBitBool();
    const isSmallText = reader.nextBitBool();
    const isANSI = reader.nextBitBool();
    const useWideOffsets = reader.nextBitBool();
    const useWideCodes = reader.nextBitBool();
    this.isItalic = reader.nextBitBool();
    this.isBold = reader.nextBitBool();

    const languageCode = reader.nextUInt8();
    const fontNameLen = reader.nextUInt8();
    const fontName = reader.nextFixedString(fontNameLen);
    this.fontName = fontName.replace(/\0+$/, "");

    const numGlyphs = reader.nextUInt16();
    const offsetTable = new Array<number>(numGlyphs);
    for (let i = 0; i < offsetTable.length; i++) {
      offsetTable[i] = (useWideOffsets ? uint32 : uint16)(reader);
    }
    const codeTableOffset = (useWideOffsets ? uint32 : uint16)(reader);
    const glyphShapeTable = new Array<Shape>(numGlyphs);
    for (let i = 0; i < glyphShapeTable.length; i++) {
      glyphShapeTable[i] = shape(1)(reader);
    }
    const codeTable = new Array<number>(numGlyphs);
    for (let i = 0; i < codeTable.length; i++) {
      codeTable[i] = reader.nextUInt16();
    }

    this.glyphShapes = glyphShapeTable;
    this.glyphCodes = codeTable;

    if (hasLayout) {
      this.ascent = reader.nextUInt16();
      this.descent = reader.nextUInt16();
      this.leading = reader.nextInt16();
      const advanceTable = new Array<number>(numGlyphs);
      for (let i = 0; i < offsetTable.length; i++) {
        advanceTable[i] = reader.nextInt16();
      }
      this.glyphAdvances = advanceTable;
    }
  }

  readonly characterId: number;
  readonly fontName: string;
  readonly isItalic: boolean;
  readonly isBold: boolean;
  readonly glyphShapes: Shape[];
  readonly glyphCodes: number[];

  readonly ascent?: number;
  readonly descent?: number;
  readonly leading?: number;
  readonly glyphAdvances?: number[];
}
