import { mat2d } from "gl-matrix";
import { rect } from "../math/rect";
import { RenderPool } from "./RenderPool";
import { TextureTarget } from "./gl/targets";
import { RenderObject } from "./RenderObject";

export class CachedRender {
  private returned = false;

  readonly renderObject: RenderObject;

  constructor(
    private readonly pool: RenderPool,
    private readonly target: TextureTarget,
    readonly view: mat2d,
    readonly bounds: rect
  ) {
    this.renderObject = RenderObject.rect(bounds, target.texture);
  }

  return() {
    if (this.returned) {
      return;
    }
    this.pool.returnTexture(this.target);
    this.returned = true;
  }
}
