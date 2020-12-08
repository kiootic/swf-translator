import { mat2d, vec4 } from "gl-matrix";
import { AVMObject } from "../../__internal/avm2/AVMObject";
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
import { pixelToTwips, TWIPS } from "../../../internal/twips";

export class BitmapData extends AVMObject {
  private __root = new SceneNode(null);
  private __needRender = false;
  private __needPixel = false;
  private __pixels: Uint32Array | null = null;
  __target: TextureTarget | null = null;
  __renderer: Renderer | null = null;

  readonly rect: Rectangle;

  constructor(
    readonly width: number,
    readonly height: number,
    readonly transparent = true,
    readonly fillColor = 0xffffffff
  ) {
    super();
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
        const node = new SceneNode(null);
        node.setRenderObjects(
          [
            RenderObject.rect(patch, target.texture, {
              invertY: false,
              scale: TWIPS,
            }),
          ],
          rect.fromValues(0, 0, pixelToTwips(patch[2]), pixelToTwips(patch[3]))
        );
        mat2d.fromTranslation(node.transformLocal, [
          pixelToTwips(patch[0]),
          pixelToTwips(patch[1]),
        ]);
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
    this.__render();
    if (this.__needPixel || !this.__pixels) {
      if (!this.__pixels) {
        this.__pixels = new Uint32Array(this.width * this.height);
      }

      const glState = this.__renderer!.glState;
      const gl = glState.gl;
      const fb = this.__target!.framebuffer.ensure(glState);
      glState.bindFramebuffer(gl.READ_FRAMEBUFFER, fb);
      const pixels = new Uint8Array(this.__pixels.buffer);
      gl.readPixels(
        0,
        0,
        this.width,
        this.height,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels
      );
      this.__needPixel = false;
    }

    const intX = Math.trunc(x);
    const intY = this.height - Math.trunc(y);
    if (intX < 0 || intY < 0 || intX > this.width || intY > this.height) {
      return 0;
    }

    const offset = intX + (this.height - intY) * this.width;
    const pixel = this.__pixels[offset];
    const a = (pixel >>> 24) & 0xff;
    const b = (pixel >>> 16) & 0xff;
    const g = (pixel >>> 8) & 0xff;
    const r = (pixel >>> 0) & 0xff;
    return a * 0x1000000 + r * 0x10000 + g * 0x100 + b * 0x1;
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
      srcY = sourceRect.y;
    const dstX = destPoint.x,
      dstY = destPoint.y;

    const srcFb = src.framebuffer.ensure(glState);
    const dstFb = dst.framebuffer.ensure(glState);
    glState.bindFramebuffer(gl.READ_FRAMEBUFFER, srcFb);
    glState.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dstFb);
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
      const srcFb = src.ensure(glState);
      const dstFb = dst.ensure(glState);
      glState.bindFramebuffer(gl.READ_FRAMEBUFFER, srcFb);
      glState.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dstFb);
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
        y,
        x + this.width,
        y + this.height,
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

    const fb = this.__renderer.renderPool.takeRenderbuffer(
      this.width,
      this.height
    );
    try {
      const glState = this.__renderer!.glState;
      const gl = glState.gl;
      this.__renderer.renderNode(
        this.__root,
        fb.framebuffer,
        this.width,
        this.height,
        clearFb,
        false
      );
      const renderFb = fb.framebuffer.ensure(glState);
      const targetFb = this.__target.framebuffer.ensure(glState);
      glState.bindFramebuffer(gl.READ_FRAMEBUFFER, renderFb);
      glState.bindFramebuffer(gl.DRAW_FRAMEBUFFER, targetFb);
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

      this.__root.onRemoveFromStage();
      this.__root = new SceneNode(null);
      this.__needRender = false;
      this.__needPixel = true;
    } finally {
      this.__renderer.renderPool.returnRenderbuffer(fb);
    }
  }
}
