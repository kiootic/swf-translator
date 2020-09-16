import { mat2d } from "gl-matrix";
import { SceneNode } from "../../../internal/render2/SceneNode";

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
    mat2d.translate(this.__value, this.__value, [dx, dy]);
    this.__node?.markLayoutDirty();
  }

  scale(sx: number, sy: number) {
    mat2d.scale(this.__value, this.__value, [sx, sy]);
    this.__node?.markLayoutDirty();
  }

  rotate(angle: number) {
    mat2d.rotate(this.__value, this.__value, angle);
    this.__node?.markLayoutDirty();
  }
}
