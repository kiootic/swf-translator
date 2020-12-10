import { vec4 } from "gl-matrix";
import { Matrix } from "./Matrix";
import { ColorTransform } from "./ColorTransform";
import type { DisplayObject } from "../display/DisplayObject";
import { SceneNode } from "../../../internal/render2/SceneNode";
import { decompose } from "../../../internal/math/matrix";

export class Transform {
  __node: SceneNode | null = null;
  __matrix = new Matrix();
  __colorTransform = new ColorTransform();

  __setNode(value: SceneNode | null) {
    this.__node = value;
    this.matrix = this.__matrix;
    this.colorTransform = this.__colorTransform;
  }

  get matrix() {
    return this.__matrix;
  }
  set matrix(value) {
    this.__matrix = value;
    if (this.__node) {
      value.__toMat2d(this.__node.transformLocal);
      if (this.__node?.object) {
        (this.__node.object as DisplayObject).__scaleSkews = decompose(
          this.__node.transformLocal
        );
      }
      this.__node.markLayoutDirty();
    }
  }

  get colorTransform() {
    return this.__colorTransform;
  }
  set colorTransform(value) {
    this.__colorTransform = value;
    if (this.__node) {
      vec4.copy(this.__node.colorTransformLocalMul, value.__mul);
      vec4.copy(this.__node.colorTransformLocalAdd, value.__add);
    }
  }
}
