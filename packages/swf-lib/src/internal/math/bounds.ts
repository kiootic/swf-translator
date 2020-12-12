import { mat2d } from "gl-matrix";
import { rect } from "./rect";

export type bounds = Int32Array;

export const bounds = {
  create(): bounds {
    return Int32Array.of(0, 0, 0, 0);
  },
  fromValues(minX: number, minY: number, maxX: number, maxY: number): bounds {
    return Int32Array.of(minX, minY, maxX, maxY);
  },
  copy(out: bounds, bounds: bounds) {
    out[0] = bounds[0];
    out[1] = bounds[1];
    out[2] = bounds[2];
    out[3] = bounds[3];
  },
  fromRect(out: bounds, rect: rect) {
    out[0] = rect[0];
    out[1] = rect[1];
    out[2] = rect[0] + rect[2];
    out[3] = rect[1] + rect[3];
  },
  toRect(out: rect, bounds: bounds) {
    out[0] = bounds[0];
    out[1] = bounds[1];
    out[2] = bounds[2] - bounds[0];
    out[3] = bounds[3] - bounds[1];
  },
  equals(a: bounds, b: bounds) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  },
  intersects(a: bounds, b: bounds) {
    return (
      a[0] - b[2] <= 0 &&
      b[0] - a[2] <= 0 &&
      a[1] - b[3] <= 0 &&
      b[1] - a[3] <= 0
    );
  },
  contains(bounds: bounds, x: number, y: number) {
    return x >= bounds[0] && x < bounds[2] && y >= bounds[1] && y < bounds[3];
  },
  union(out: bounds, a: bounds, b: bounds) {
    if (a[0] === a[2] || a[1] === a[3]) {
      bounds.copy(out, b);
    }
    if (b[0] === b[2] || b[1] === b[3]) {
      bounds.copy(out, a);
    }

    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    out[3] = Math.max(a[3], b[3]);
    return out;
  },
  apply(out: bounds, bounds: bounds, mat: mat2d) {
    let x = mat[0] * bounds[0] + mat[2] * bounds[1] + mat[4];
    let y = mat[1] * bounds[0] + mat[3] * bounds[1] + mat[5];
    let minX = x,
      minY = y,
      maxX = x,
      maxY = y;

    x = mat[0] * bounds[2] + mat[2] * bounds[1] + mat[4];
    y = mat[1] * bounds[2] + mat[3] * bounds[1] + mat[5];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    x = mat[0] * bounds[0] + mat[2] * bounds[3] + mat[4];
    y = mat[1] * bounds[0] + mat[3] * bounds[3] + mat[5];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    x = mat[0] * bounds[2] + mat[2] * bounds[3] + mat[4];
    y = mat[1] * bounds[2] + mat[3] * bounds[3] + mat[5];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    out[0] = Math.round(minX);
    out[1] = Math.round(minY);
    out[2] = Math.round(maxX);
    out[3] = Math.round(maxY);
    return out;
  },
};
