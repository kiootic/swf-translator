import { mat2d } from "gl-matrix";

export function projection(
  out: mat2d,
  width: number,
  height: number,
  invertY: boolean
) {
  mat2d.identity(out);
  out[0] = 2 / width;
  out[3] = (invertY ? -2 : 2) / height;
  out[4] = -1;
  out[5] = invertY ? 1 : -1;
  return out;
}
