import {
  FillStyle as SWFFillStyle,
  LineStyle as SWFLineStyle,
} from "../format/structs/shape";
import { color, matrix, Matrix } from "./primitives";
import { gradient, Gradient } from "./gradient";

export enum FillStyleKind {
  SolidColor = 0,
  LinearGradient = 1,
  RadicalGradient = 2,
  ClippedBitmap = 3,
}

export type FillStyle =
  | FillStyleSolidColor
  | FillStyleGradient
  | FillStyleBitmap;

export interface FillStyleSolidColor {
  kind: FillStyleKind.SolidColor;
  color: number;
}

export interface FillStyleGradient {
  kind: FillStyleKind.LinearGradient | FillStyleKind.RadicalGradient;
  matrix: Matrix;
  gradient: Gradient;
}

export interface FillStyleBitmap {
  kind: FillStyleKind.ClippedBitmap;
  matrix: Matrix;
  characterId: number;
}

export function fillStyle(style: SWFFillStyle): FillStyle {
  switch (style.type) {
    case 0:
      return { kind: FillStyleKind.SolidColor, color: color(style.color!) };
    case 0x10:
      return {
        kind: FillStyleKind.LinearGradient,
        matrix: matrix(style.gradientMatrix!),
        gradient: gradient(style.gradient!),
      };
    case 0x12:
      return {
        kind: FillStyleKind.RadicalGradient,
        matrix: matrix(style.gradientMatrix!),
        gradient: gradient(style.gradient!),
      };
    case 0x43:
      return {
        kind: FillStyleKind.ClippedBitmap,
        matrix: matrix(style.bitmapMatrix!),
        characterId: style.bitmapId!,
      };
    default:
      throw new Error(`unsupported fill style type: ${style.type}`);
  }
}

export enum CapStyle {
  Round = 0,
  No = 1,
  Square = 2,
}

function capStyle(style: number): CapStyle {
  switch (style) {
    case 0:
      return CapStyle.Round;
    case 2:
      return CapStyle.Square;
    default:
      throw new Error(`unsupported cap style: ${style}`);
  }
}

export enum JoinStyle {
  Round = 0,
  Bevel = 1,
  Miter = 2,
}

function joinStyle(style: number): JoinStyle {
  switch (style) {
    case 0:
      return JoinStyle.Round;
    case 2:
      return JoinStyle.Miter;
    default:
      throw new Error(`unsupported join style: ${style}`);
  }
}

export interface LineStyle {
  width: number;
  startCap: CapStyle;
  endCap: CapStyle;
  join: JoinStyle;
  miterLimit: number;
  fill: number | FillStyle;
}

export function lineStyle(style: SWFLineStyle): LineStyle {
  return {
    width: style.width,
    startCap: capStyle(style.startCapStyle),
    endCap: capStyle(style.endCapStyle),
    join: joinStyle(style.joinStyle),
    miterLimit: (style.miterLimitFactor ?? 1.5) * 2,
    fill: style.color ? color(style.color) : fillStyle(style.fillType!),
  };
}
