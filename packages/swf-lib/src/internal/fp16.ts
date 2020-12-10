import { mat2d } from "gl-matrix";
import type { rect } from "./math/rect";

export function roundToFP1616(value: number) {
  return Math.trunc(value * 65536) / 65536;
}

export function fpMat(mat: mat2d) {
  mat[0] = roundToFP1616(mat[0]);
  mat[1] = roundToFP1616(mat[1]);
  mat[2] = roundToFP1616(mat[2]);
  mat[3] = roundToFP1616(mat[3]);
  mat[4] = Math.trunc(mat[4]);
  mat[5] = Math.trunc(mat[5]);
}

export function fpRect(rect: rect) {
  rect[0] = Math.trunc(rect[0]);
  rect[1] = Math.trunc(rect[1]);
  rect[2] = Math.trunc(rect[2]);
  rect[3] = Math.trunc(rect[3]);
}
