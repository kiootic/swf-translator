import { FillStyle, LineStyle, fillStyleArray, lineStyleArray } from "./styles";
import { Parser } from "../../binary";

export type ShapeRecord =
  | ShapeRecordStyleChange
  | ShapeRecordStraightEdge
  | ShapeRecordCurvedEdge;

export interface ShapeRecordStyleChange {
  type: 0;
  moveTo?: { x: number; y: number };
  fillStyle0?: number;
  fillStyle1?: number;
  lineStyle?: number;
  fillStyles?: FillStyle[];
  lineStyles?: LineStyle[];
}

export interface ShapeRecordStraightEdge {
  type: 1;
  straight: 1;
  deltaX: number;
  deltaY: number;
}

export interface ShapeRecordCurvedEdge {
  type: 1;
  straight: 0;
  controlDeltaX: number;
  controlDeltaY: number;
  anchorDeltaX: number;
  anchorDeltaY: number;
}

export interface ShapeWithStyle {
  fillStyles: FillStyle[];
  lineStyles: LineStyle[];
  shapeRecords: ShapeRecord[];
}

export interface Shape {
  shapeRecords: ShapeRecord[];
}

export function shape(version: 1 | 2 | 3 | 4): Parser<Shape> {
  return (reader) => {
    let numFillBits = reader.nextBits(4);
    let numLineBits = reader.nextBits(4);
    const shapeRecords: ShapeRecord[] = [];
    while (true) {
      const type = reader.nextBits(1);
      if (type === 0) {
        const hasNewStyles = reader.nextBitBool();
        const hasLineStyle = reader.nextBitBool();
        const hasFillStyle1 = reader.nextBitBool();
        const hasFillStyle0 = reader.nextBitBool();
        const hasMoveTo = reader.nextBitBool();
        const record: ShapeRecordStyleChange = { type };
        let hasChanges = false;
        if (hasMoveTo) {
          const nBits = reader.nextBits(5);
          record.moveTo = {
            x: reader.nextSBits(nBits),
            y: reader.nextSBits(nBits),
          };
          hasChanges = true;
        }
        if (hasFillStyle0) {
          record.fillStyle0 = reader.nextBits(numFillBits);
          hasChanges = true;
        }
        if (hasFillStyle1) {
          record.fillStyle1 = reader.nextBits(numFillBits);
          hasChanges = true;
        }
        if (hasLineStyle) {
          record.lineStyle = reader.nextBits(numLineBits);
          hasChanges = true;
        }
        if (hasNewStyles) {
          record.fillStyles = fillStyleArray(version)(reader);
          record.lineStyles = lineStyleArray(version)(reader);
          numFillBits = reader.nextBits(4);
          numLineBits = reader.nextBits(4);
          hasChanges = true;
        }
        if (!hasChanges) {
          break;
        }
        shapeRecords.push(record);
        continue;
      }

      const straight = reader.nextBits(1);
      const nBits = reader.nextBits(4) + 2;
      if (straight === 1) {
        const isGeneralLine = reader.nextBitBool();
        let hasDeltaX = false,
          hasDeltaY = false;
        if (isGeneralLine) {
          hasDeltaX = true;
          hasDeltaY = true;
        } else {
          const isVertical = reader.nextBitBool();
          hasDeltaX = !isVertical;
          hasDeltaY = isVertical;
        }
        const record: ShapeRecordStraightEdge = {
          type: 1,
          straight: 1,
          deltaX: hasDeltaX ? reader.nextSBits(nBits) : 0,
          deltaY: hasDeltaY ? reader.nextSBits(nBits) : 0,
        };
        shapeRecords.push(record);
      } else {
        const record: ShapeRecordCurvedEdge = {
          type: 1,
          straight: 0,
          controlDeltaX: reader.nextSBits(nBits),
          controlDeltaY: reader.nextSBits(nBits),
          anchorDeltaX: reader.nextSBits(nBits),
          anchorDeltaY: reader.nextSBits(nBits),
        };
        shapeRecords.push(record);
      }
    }

    reader.flushBits();
    return {
      shapeRecords,
    };
  };
}

export function shapeWithStyle(version: 1 | 2 | 3 | 4): Parser<ShapeWithStyle> {
  return (reader) => {
    const fillStyles = fillStyleArray(version)(reader);
    const lineStyles = lineStyleArray(version)(reader);
    const { shapeRecords } = shape(version)(reader);

    return {
      fillStyles,
      lineStyles,
      shapeRecords,
    };
  };
}
