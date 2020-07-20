import { Matrix } from "./primitives";

export enum GradientMode {
  Pad = 0,
}

export interface Gradient {
  mode: GradientMode;
  points: [number, number][];
}

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
