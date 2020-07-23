import { RGBA, rgba, rgb2rgba } from "./color";
import { Parser } from "../../binary";

export interface TextRecord {
  fontId?: number;
  textColor?: RGBA;
  xOffset?: number;
  yOffset?: number;
  textHeight?: number;
  glyphs: GlyphEntry[];
}

export interface GlyphEntry {
  index: number;
  advance: number;
}

export function textRecords(version: 1 | 2): Parser<TextRecord[]> {
  return (reader) => {
    const records: TextRecord[] = [];
    const glyphBits = reader.nextUInt8();
    const advanceBits = reader.nextUInt8();

    while (reader.nextBitBool()) {
      reader.nextBits(3);
      const hasFont = reader.nextBitBool();
      const hasColor = reader.nextBitBool();
      const hasYOffset = reader.nextBitBool();
      const hasXOffset = reader.nextBitBool();

      const record: TextRecord = { glyphs: [] };
      if (hasFont) {
        record.fontId = reader.nextUInt16();
      }
      if (hasColor) {
        record.textColor = (version >= 2 ? rgba : rgb2rgba)(reader);
      }
      if (hasXOffset) {
        record.xOffset = reader.nextInt16();
      }
      if (hasYOffset) {
        record.yOffset = reader.nextInt16();
      }
      if (hasFont) {
        record.textHeight = reader.nextUInt16();
      }

      const numGlyphs = reader.nextUInt8();
      for (let i = 0; i < numGlyphs; i++) {
        const index = reader.nextBits(glyphBits);
        const advance = reader.nextSBits(advanceBits);
        record.glyphs.push({ index, advance });
      }

      records.push(record);
    }

    reader.flushBits();
    return records;
  };
}
