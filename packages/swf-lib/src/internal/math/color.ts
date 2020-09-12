import { vec4 } from "gl-matrix";

export function preMultiplyAlpha(color: number): number {
  let a = (color >>> 24) & 0xff;
  let r = (color >>> 16) & 0xff;
  let g = (color >>> 8) & 0xff;
  let b = (color >>> 0) & 0xff;
  const alpha = a / 0xff;
  r = Math.round(r * alpha) & 0xff;
  g = Math.round(g * alpha) & 0xff;
  b = Math.round(b * alpha) & 0xff;
  return r * 0x1 + g * 0x100 + b * 0x10000 + a * 0x1000000;
}

export function decomposeColorVec(out: vec4, color: number): vec4 {
  out[0] = ((color >>> 0) & 0xff) / 0xff;
  out[1] = ((color >>> 8) & 0xff) / 0xff;
  out[2] = ((color >>> 16) & 0xff) / 0xff;
  out[3] = ((color >>> 24) & 0xff) / 0xff;
  return out;
}

export function multiplyColorTransform(
  outMul: vec4,
  outAdd: vec4,
  parentMul: vec4,
  parentAdd: vec4,
  childMul: vec4,
  childAdd: vec4
) {
  vec4.mul(outMul, childMul, parentMul);
  vec4.mul(outAdd, childAdd, parentMul);
  vec4.add(outAdd, outAdd, parentAdd);
}
