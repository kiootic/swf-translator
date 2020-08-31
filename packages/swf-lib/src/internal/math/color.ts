import { vec4 } from "gl-matrix";

export function preMultiplyAlpha(out: vec4, color: number): vec4 {
  vec4.set(
    out,
    ((color >>> 16) & 0xff) / 0xff,
    ((color >>> 8) & 0xff) / 0xff,
    ((color >>> 0) & 0xff) / 0xff,
    ((color >>> 24) & 0xff) / 0xff
  );
  vec4.mul(out, out, [out[3], out[3], out[3], 1]);
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
