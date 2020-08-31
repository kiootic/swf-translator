import { Matrix } from "./Matrix";
import { ColorTransform } from "./ColorTransform";
import { SceneNode } from "../../../internal/render/SceneNode";

export class Transform {
  __node: SceneNode | null = null;
  __matrix = new Matrix();
  __colorTransform = new ColorTransform();

  __setNode(value: SceneNode | null) {
    this.__node = value;
    this.matrix.__setNode(value);
    this.colorTransform.__setNode(value);
  }

  get matrix() {
    return this.__matrix;
  }
  set matrix(value) {
    this.__matrix.__setNode(null);
    this.__matrix = value;
    this.__matrix.__setNode(this.__node);
  }

  get colorTransform() {
    return this.__colorTransform;
  }
  set colorTransform(value) {
    this.__colorTransform.__setNode(null);
    this.__colorTransform = value;
    this.__colorTransform.__setNode(this.__node);
  }
}
