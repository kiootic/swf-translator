import { mat2d } from "gl-matrix";
import { decompose } from "../../../internal/math/matrix";
import { SceneNode } from "../../../internal/render2/SceneNode";
import { pixelToTwips, twipsToPixel } from "../../../internal/twips";
import type { DisplayObject } from "../display/DisplayObject";

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
      this.__markDirty();
    } else {
      this.__value = mat2d.clone(this.__value);
    }
  }

  __markDirty() {
    if (this.__node?.object) {
      (this.__node.object as DisplayObject).__scaleSkews = decompose(
        this.__value
      );
    }
    this.__node?.markLayoutDirty();
  }

  translate(dx: number, dy: number) {
    this.__value[4] = pixelToTwips(twipsToPixel(this.__value[4]) + dx);
    this.__value[5] = pixelToTwips(twipsToPixel(this.__value[5]) + dy);
    this.__markDirty();
  }

  scale(sx: number, sy: number) {
    this.__value[0] *= sx;
    this.__value[1] *= sy;
    this.__value[2] *= sx;
    this.__value[3] *= sy;
    this.__value[4] = pixelToTwips(twipsToPixel(this.__value[4]) * sx);
    this.__value[5] = pixelToTwips(twipsToPixel(this.__value[5]) * sy);
    this.__markDirty();
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
    this.__value[4] = pixelToTwips(twipsToPixel(tx) * u - twipsToPixel(ty) * v);
    this.__value[5] = pixelToTwips(twipsToPixel(tx) * v + twipsToPixel(ty) * u);
    this.__markDirty();
  }
}
