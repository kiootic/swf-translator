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
