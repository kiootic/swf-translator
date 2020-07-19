import { FillStyle as SWFFillStyle } from "../format/structs/shape";
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
