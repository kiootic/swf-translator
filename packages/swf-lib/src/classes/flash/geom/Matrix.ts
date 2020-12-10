import { mat2d } from "gl-matrix";
import { roundToFP1616 } from "../../../internal/fp16";

export class Matrix {
  constructor(
    public a = 1,
    public b = 0,
    public c = 0,
    public d = 1,
    public tx = 0,
    public ty = 0
  ) {}

  translate(dx: number, dy: number) {
    this.tx += dx;
    this.ty += dy;
  }

  scale(sx: number, sy: number) {
    this.a *= sx;
    this.b *= sy;
    this.c *= sx;
    this.d *= sy;
    this.tx *= sx;
    this.ty *= sy;
  }

  rotate(angle: number) {
    const a = this.a;
    const b = this.b;
    const c = this.c;
    const d = this.d;
    const tx = this.tx;
    const ty = this.ty;
    const u = Math.sin(angle);
    const v = Math.cos(angle);
    this.a = a * u - b * v;
    this.b = a * v + b * u;
    this.c = c * u - d * v;
    this.d = c * v + d * u;
    this.tx = tx * u - ty * v;
    this.ty = tx * v + ty * u;
  }

  __toMat2d(mat: mat2d) {
    mat[0] = roundToFP1616(this.a);
    mat[1] = roundToFP1616(this.b);
    mat[2] = roundToFP1616(this.c);
    mat[3] = roundToFP1616(this.d);
    mat[4] = Math.trunc(this.tx * 20);
    mat[5] = Math.trunc(this.ty * 20);
  }
}
