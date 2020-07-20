import { RGBA, rgba, rgb2rgba } from "./color";
import { Matrix, matrix } from "./geom";
import { FocalGradient, Gradient, focalGradient, gradient } from "./gradient";
import { Parser, fixed8, uint16 } from "../../binary";

export interface FillStyle {
  type: number;
  color?: RGBA;
  gradientMatrix?: Matrix;
  gradient?: Gradient | FocalGradient;
  bitmapId?: number;
  bitmapMatrix?: Matrix;
}

function fillStyleArray(version: 1 | 2 | 3 | 4): Parser<FillStyle[]> {
  return (reader) => {
    let n = reader.nextUInt8();
    if (n === 0xff && version >= 2) {
      n += reader.nextUInt16();
    }
    const styles = new Array<FillStyle>(n);
    for (let i = 0; i < styles.length; i++) {
      styles[i] = fillStyle(version)(reader);
    }
    return styles;
  };
}

export function fillStyle(version: 1 | 2 | 3 | 4): Parser<FillStyle> {
  return (reader) => {
    const type = reader.nextUInt8();
    const fillStyle: FillStyle = { type };
    switch (type) {
      case 0x00:
        fillStyle.color = (version >= 3 ? rgba : rgb2rgba)(reader);
        break;
      case 0x10:
      case 0x12:
      case 0x13:
        fillStyle.gradientMatrix = matrix(reader);
        if (type === 0x13) {
          fillStyle.gradient = focalGradient(version)(reader);
        } else {
          fillStyle.gradient = gradient(version)(reader);
        }
        break;
      case 0x40:
      case 0x41:
      case 0x42:
      case 0x43:
        fillStyle.bitmapId = reader.nextUInt16();
        fillStyle.bitmapMatrix = matrix(reader);
        break;
    }
    return fillStyle;
  };
}

export interface LineStyle {
  width: number;
  startCapStyle: number;
  joinStyle: number;
  noHScale: boolean;
  noVScale: boolean;
  pixelHinting: boolean;
  noClose: boolean;
  endCapStyle: number;
  miterLimitFactor?: number;
  color?: RGBA;
  fillType?: FillStyle;
}

function lineStyleArray(version: 1 | 2 | 3 | 4): Parser<LineStyle[]> {
  return (reader) => {
    let n = reader.nextUInt8();
    if (n === 0xff && version >= 2) {
      n += reader.nextUInt16();
    }
    const styles = new Array<LineStyle>(n);
    for (let i = 0; i < styles.length; i++) {
      styles[i] = lineStyle(version)(reader);
    }
    return styles;
  };
}

export function lineStyle(version: 1 | 2 | 3 | 4): Parser<LineStyle> {
  if (version < 4) {
    return (reader) => {
      const width = reader.nextUInt16();
      const color = (version >= 3 ? rgba : rgb2rgba)(reader);
      return {
        width,
        startCapStyle: 0,
        joinStyle: 0,
        noHScale: false,
        noVScale: false,
        pixelHinting: false,
        noClose: false,
        endCapStyle: 0,
        color,
      };
    };
  }

  return (reader) => {
    const width = reader.nextUInt16();

    const startCapStyle = reader.nextBits(2);
    const joinStyle = reader.nextBits(2);
    const hasFill = reader.nextBitBool();
    const noHScale = reader.nextBitBool();
    const noVScale = reader.nextBitBool();
    const pixelHinting = reader.nextBitBool();
    reader.nextBits(5);
    const noClose = reader.nextBitBool();
    const endCapStyle = reader.nextBits(2);

    const style: LineStyle = {
      width,
      startCapStyle,
      joinStyle,
      noHScale,
      noVScale,
      pixelHinting,
      noClose,
      endCapStyle,
    };

    if (joinStyle === 2) {
      style.miterLimitFactor = fixed8(uint16)(reader);
    }
    if (hasFill) {
      style.fillType = fillStyle(version)(reader);
    } else {
      style.color = rgba(reader);
    }
    return style;
  };
}

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

export function shapeWithStyle(version: 1 | 2 | 3 | 4): Parser<ShapeWithStyle> {
  return (reader) => {
    const fillStyles = fillStyleArray(version)(reader);
    const lineStyles = lineStyleArray(version)(reader);
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

    return {
      fillStyles,
      lineStyles,
      shapeRecords,
    };
  };
}
