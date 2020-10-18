import { mat2d } from "gl-matrix";
import { SceneNode, roundTwips } from "../../../internal/render2/SceneNode";

export class Matrix {
  __node: SceneNode | null = null;
  __value: mat2d;

  constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
    this.__value = mat2d.fromValues(a, b, c, d, tx, ty);
  }

  __setNode(value: SceneNode | null) {
    if (value) {
      mat2d.copy(value.transformLocal, this.__value);
      this.__value = value.transformLocal;
    } else {
      this.__value = mat2d.clone(this.__value);
    }
  }

  translate(dx: number, dy: number) {
    this.__value[4] = roundTwips(this.__value[4] + dx);
    this.__value[5] = roundTwips(this.__value[5] + dy);
    this.__node?.markLayoutDirty();
  }

  scale(sx: number, sy: number) {
    this.__value[0] *= sx;
    this.__value[1] *= sy;
    this.__value[2] *= sx;
    this.__value[3] *= sy;
    this.__value[4] = roundTwips(this.__value[4] * sx);
    this.__value[5] = roundTwips(this.__value[5] * sy);
    this.__node?.markLayoutDirty();
  }

  rotate(angle: number) {
    const a = this.__value[0];
    const b = this.__value[1];
    const c = this.__value[2];
    const d = this.__value[3];
    const tx = this.__value[4];
    const ty = this.__value[5];
    const u = Math.sin(angle);
    const v = Math.cos(angle);
    this.__value[0] = a * u - b * v;
    this.__value[1] = a * v + b * u;
    this.__value[2] = c * u - d * v;
    this.__value[3] = c * v + d * u;
    this.__value[4] = roundTwips(tx * u - ty * v);
    this.__value[5] = roundTwips(tx * v + ty * u);
    this.__node?.markLayoutDirty();
  }
}
