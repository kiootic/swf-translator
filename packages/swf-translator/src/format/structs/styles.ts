import { RGBA, rgba, rgb2rgba } from "./color";
import { Matrix, matrix } from "./geom";
import {
  FocalGradient,
  Gradient,
  MorphGradient,
  focalGradient,
  gradient,
  morphGradient,
} from "./gradient";
import { Parser, fixed8, uint16 } from "../../binary";

function array<T>(isExtended: boolean, parser: Parser<T>): Parser<T[]> {
  return (reader) => {
    let n = reader.nextUInt8();
    if (n === 0xff && isExtended) {
      n += reader.nextUInt16();
    }
    const array = new Array<T>(n);
    for (let i = 0; i < array.length; i++) {
      array[i] = parser(reader);
    }
    return array;
  };
}

export interface FillStyle {
  type: number;
  color?: RGBA;
  gradientMatrix?: Matrix;
  gradient?: Gradient | FocalGradient;
  bitmapId?: number;
  bitmapMatrix?: Matrix;
}

export interface MorphFillStyle {
  type: number;
  startColor?: RGBA;
  endColor?: RGBA;
  startGradientMatrix?: Matrix;
  endGradientMatrix?: Matrix;
  gradient?: MorphGradient;
  bitmapId?: number;
  startBitmapMatrix?: Matrix;
  endBitmapMatrix?: Matrix;
}

export function fillStyleArray(version: 1 | 2 | 3 | 4): Parser<FillStyle[]> {
  return array(version >= 2, fillStyle(version));
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

export const morphFillStyle: Parser<MorphFillStyle> = (reader) => {
  const type = reader.nextUInt8();
  const fillStyle: MorphFillStyle = { type };
  switch (type) {
    case 0x00:
      fillStyle.startColor = rgba(reader);
      fillStyle.endColor = rgba(reader);
      break;
    case 0x10:
    case 0x12:
    case 0x13:
      fillStyle.startGradientMatrix = matrix(reader);
      fillStyle.endGradientMatrix = matrix(reader);
      fillStyle.gradient = morphGradient(reader);
      break;
    case 0x40:
    case 0x41:
    case 0x42:
    case 0x43:
      fillStyle.bitmapId = reader.nextUInt16();
      fillStyle.startBitmapMatrix = matrix(reader);
      fillStyle.endBitmapMatrix = matrix(reader);
      break;
  }
  return fillStyle;
};

export const morphFillStyleArray = array(true, morphFillStyle);

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

export interface MorphLineStyle {
  startWidth: number;
  endWidth: number;
  startCapStyle: number;
  joinStyle: number;
  noHScale: boolean;
  noVScale: boolean;
  pixelHinting: boolean;
  noClose: boolean;
  endCapStyle: number;
  miterLimitFactor?: number;
  startColor?: RGBA;
  endColor?: RGBA;
  fillType?: MorphFillStyle;
}

export function lineStyleArray(version: 1 | 2 | 3 | 4): Parser<LineStyle[]> {
  return array(version >= 2, lineStyle(version));
}

export function morphLineStyleArray(version: 1 | 2): Parser<MorphLineStyle[]> {
  return array(true, morphLineStyle(version));
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

export function morphLineStyle(version: 1 | 2): Parser<MorphLineStyle> {
  if (version < 2) {
    return (reader) => {
      const startWidth = reader.nextUInt16();
      const endWidth = reader.nextUInt16();
      const startColor = rgba(reader);
      const endColor = rgba(reader);
      return {
        startWidth,
        endWidth,
        startCapStyle: 0,
        joinStyle: 0,
        noHScale: false,
        noVScale: false,
        pixelHinting: false,
        noClose: false,
        endCapStyle: 0,
        startColor,
        endColor,
      };
    };
  }

  return (reader) => {
    const startWidth = reader.nextUInt16();
    const endWidth = reader.nextUInt16();

    const startCapStyle = reader.nextBits(2);
    const joinStyle = reader.nextBits(2);
    const hasFill = reader.nextBitBool();
    const noHScale = reader.nextBitBool();
    const noVScale = reader.nextBitBool();
    const pixelHinting = reader.nextBitBool();
    reader.nextBits(5);
    const noClose = reader.nextBitBool();
    const endCapStyle = reader.nextBits(2);

    const style: MorphLineStyle = {
      startWidth,
      endWidth,
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
      style.fillType = morphFillStyle(reader);
    } else {
      style.startColor = rgba(reader);
      style.endColor = rgba(reader);
    }
    return style;
  };
}
