import { mat2d } from "gl-matrix";

export function roundToFP1616(value: number) {
  return Math.round(value * 65536) / 65536;
}

export function fpMat(mat: mat2d) {
  mat[0] = roundToFP1616(mat[0]);
  mat[1] = roundToFP1616(mat[1]);
  mat[2] = roundToFP1616(mat[2]);
  mat[3] = roundToFP1616(mat[3]);
  mat[4] = Math.round(mat[4]);
  mat[5] = Math.round(mat[5]);
}

export function fpMatMul(out: mat2d, a: mat2d, b: mat2d) {
  const a0 = a[0];
  const a1 = a[1];
  const a2 = a[2];
  const a3 = a[3];
  const a4 = a[4];
  const a5 = a[5];
  const b0 = b[0];
  const b1 = b[1];
  const b2 = b[2];
  const b3 = b[3];
  const b4 = b[4];
  const b5 = b[5];
  out[0] = Math.fround(a0 * b0) + Math.fround(a2 * b1);
  out[1] = Math.fround(a1 * b0) + Math.fround(a3 * b1);
  out[2] = Math.fround(a0 * b2) + Math.fround(a2 * b3);
  out[3] = Math.fround(a1 * b2) + Math.fround(a3 * b3);
  out[4] = Math.round(a0 * b4 + a2 * b5) + a4;
  out[5] = Math.round(a1 * b4 + a3 * b5) + a5;
}
