import { mat2d, vec2 } from "gl-matrix";

export type rect = [number, number, number, number];

export const rect = {
  create(): rect {
    return [0, 0, 0, 0];
  },
  fromValues(x: number, y: number, width: number, height: number): rect {
    return [x, y, width, height];
  },
  copy(out: rect, rect: rect) {
    out[0] = rect[0];
    out[1] = rect[1];
    out[2] = rect[2];
    out[3] = rect[3];
    return out;
  },
  equals(a: rect, b: rect) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  },
  intersects(a: rect, b: rect) {
    return (
      a[0] < b[0] + b[2] &&
      a[0] + a[2] > b[0] &&
      a[1] < b[1] + b[3] &&
      a[1] + a[3] > b[1]
    );
  },
  contains(rect: rect, x: number, y: number) {
    return (
      x >= rect[0] &&
      x < rect[0] + rect[2] &&
      y >= rect[1] &&
      y < rect[1] + rect[3]
    );
  },
  clear(out: rect) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
  },
  scale(out: rect, rect: rect, factor: number) {
    out[0] = rect[0] * factor;
    out[1] = rect[1] * factor;
    out[2] = rect[2] * factor;
    out[3] = rect[3] * factor;
    return out;
  },
  translate(out: rect, rect: rect, t: vec2) {
    out[0] = rect[0] + t[0];
    out[1] = rect[1] + t[1];
    out[2] = rect[2];
    out[3] = rect[3];
    return out;
  },
  union(out: rect, a: rect, b: rect) {
    if (a[2] === 0 || a[3] === 0) {
      rect.copy(out, b);
    } else if (b[2] === 0 || b[3] === 0) {
      rect.copy(out, a);
    }

    const minX = Math.min(a[0], b[0]);
    const minY = Math.min(a[1], b[1]);
    const maxX = Math.max(a[0] + a[2], b[0] + b[2]);
    const maxY = Math.max(a[1] + a[3], b[1] + b[3]);

    out[0] = minX;
    out[1] = minY;
    out[2] = maxX - minX;
    out[3] = maxY - minY;
    return out;
  },
  apply(out: rect, rect: rect, mat: mat2d) {
    const vec: [number, number] = [0, 0];
    let [x, y] = vec2.transformMat2d(vec, [rect[0], rect[1]], mat);
    let minX = x,
      minY = y,
      maxX = x,
      maxY = y;

    [x, y] = vec2.transformMat2d(vec, [rect[0] + rect[2], rect[1]], mat);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    [x, y] = vec2.transformMat2d(vec, [rect[0], rect[1] + rect[3]], mat);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    [x, y] = vec2.transformMat2d(
      vec,
      [rect[0] + rect[2], rect[1] + rect[3]],
      mat
    );
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    out[0] = minX;
    out[1] = minY;
    out[2] = maxX - minX;
    out[3] = maxY - minY;
    return out;
  },
};
