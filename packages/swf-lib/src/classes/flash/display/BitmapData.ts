import { mat2d, vec4 } from "gl-matrix";
import { DisplayObject } from "./DisplayObject";
import { Matrix } from "../geom/Matrix";
import { ColorTransform } from "../geom/ColorTransform";
import { Rectangle } from "../geom/Rectangle";
import { Point } from "../geom/Point";
import { SceneNode } from "../../../internal/render2/SceneNode";
import { TextureTarget } from "../../../internal/render2/gl/targets";
import { Renderer } from "../../../internal/render2/Renderer";
import { Stage } from "./Stage";
import { rect } from "../../../internal/math/rect";
import { RenderObject } from "../../../internal/render2/RenderObject";

export class BitmapData {
  private __root = new SceneNode();
  private __needRender = false;
  __target: TextureTarget | null = null;
  __renderer: Renderer | null = null;

  readonly rect: Rectangle;

  constructor(
    readonly width: number,
    readonly height: number,
    readonly transparent = true,
    readonly fillColor = 0xffffffff
  ) {
    this.rect = new Rectangle(0, 0, width, height);
  }

  draw(
    source: DisplayObject,
    matrix?: Matrix,
    colorTransform?: ColorTransform,
    blendMode?: String
  ) {
    const sourceNode = source.__node.clone();
    sourceNode.visible = true;
    if (matrix) {
      mat2d.copy(sourceNode.transformLocal, matrix.__value);
    } else {
      mat2d.identity(sourceNode.transformLocal);
    }
    if (colorTransform) {
      vec4.copy(sourceNode.colorTransformLocalMul, colorTransform.__mul);
      vec4.copy(sourceNode.colorTransformLocalAdd, colorTransform.__add);
    } else {
      vec4.set(sourceNode.colorTransformLocalMul, 1, 1, 1, 1);
      vec4.set(sourceNode.colorTransformLocalAdd, 0, 0, 0, 0);
    }
    sourceNode.setParent(this.__root, this.__root.children.length);
    this.__needRender = true;
  }

  colorTransform(bounds: Rectangle, trx: ColorTransform) {
    this.__render();
    const target = this.__target!;
    this.__target = null;
    try {
      const [x, y, width, height] = bounds.__rect;
      const addPatch = (patch: rect, apply: boolean) => {
        if (patch[2] <= 0 || patch[3] <= 0) {
          return;
        }
        const node = new SceneNode();
        node.setRenderObjects(
          [RenderObject.rect(patch, target.texture, true)],
          rect.fromValues(0, 0, patch[2], patch[3])
        );
        mat2d.fromTranslation(node.transformLocal, [patch[0], patch[1]]);
        if (apply) {
          vec4.copy(node.colorTransformLocalMul, trx.__mul);
          vec4.copy(node.colorTransformLocalAdd, trx.__add);
        }
        node.setParent(this.__root, this.__root.children.length);
      };
      addPatch(rect.fromValues(0, 0, this.width, y), false);
      addPatch(rect.fromValues(0, y, x, height), false);
      addPatch(rect.fromValues(x, y, width, height), true);
      addPatch(
        rect.fromValues(x + width, y, this.width - (x + width), height),
        false
      );
      addPatch(
        rect.fromValues(0, y + height, this.width, this.height - (y + height)),
        false
      );

      this.__render();
    } finally {
      this.__renderer!.renderPool.returnTexture(target);
    }
  }

  getPixel32(x: number, y: number) {
    return 0;
  }

  lock() {}

  unlock() {}

  copyPixels(
    sourceBitmapData: BitmapData,
    sourceRect: Rectangle,
    destPoint: Point
  ) {
    this.__render();
    sourceBitmapData.__render();

    const glState = this.__renderer!.glState;
    const gl = glState.gl;
    const src = sourceBitmapData.__target!;
    const dst = this.__target!;

    const srcX = sourceRect.x,
      srcY = this.height - sourceRect.y - sourceRect.height;
    const dstX = destPoint.x,
      dstY = this.height - destPoint.y - sourceRect.height;

    glState.bindFramebuffer(gl.READ_FRAMEBUFFER, src.framebuffer.framebuffer);
    glState.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dst.framebuffer.framebuffer);
    gl.blitFramebuffer(
      srcX,
      srcY,
      srcX + sourceRect.width,
      srcY + sourceRect.height,
      dstX,
      dstY,
      dstX + sourceRect.width,
      dstY + sourceRect.height,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST
    );
  }

  scroll(x: number, y: number) {
    this.__render();
    const target = this.__target!;
    const renderer = this.__renderer!;
    this.__target = renderer.renderPool.takeTexture(this.width, this.height);
    try {
      const src = target.framebuffer;
      const dst = this.__target.framebuffer;
      const glState = this.__renderer!.glState;
      const gl = glState.gl;
      glState.bindFramebuffer(gl.READ_FRAMEBUFFER, src.framebuffer);
      glState.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dst.framebuffer);
      gl.blitFramebuffer(
        0,
        0,
        this.width,
        this.height,
        0,
        0,
        this.width,
        this.height,
        gl.COLOR_BUFFER_BIT,
        gl.NEAREST
      );
      gl.blitFramebuffer(
        0,
        0,
        this.width,
        this.height,
        x,
        -y,
        x + this.width,
        -y + this.height,
        gl.COLOR_BUFFER_BIT,
        gl.NEAREST
      );
    } finally {
      renderer.renderPool.returnTexture(target);
    }
  }

  dispose() {
    if (this.__target) {
      this.__renderer?.renderPool.returnTexture(this.__target);
      this.__target = null;
    }
    this.__needRender = true;
  }

  __render() {
    if (this.__target && !this.__needRender) {
      return;
    }

    if (!this.__renderer) {
      if (!Stage.__current) {
        throw new Error("No stage in context");
      }
      this.__renderer = Stage.__current.__renderer;
    }

    let clearFb = () => {};
    if (!this.__target) {
      const glState = this.__renderer.glState;
      this.__target = this.__renderer.renderPool.takeTexture(
        this.width,
        this.height
      );
      clearFb = () => {
        glState.setClearColor(0, 0, 0, 0);
        glState.gl.clear(glState.gl.COLOR_BUFFER_BIT);
      };
    }
    this.__renderer.renderNode(
      this.__root,
      this.__target?.framebuffer,
      clearFb
    );
    this.__root.onRemoveFromStage();
    this.__root = new SceneNode();
    this.__needRender = false;
  }
}
