import { mat2d, vec2 } from "gl-matrix";
import { rect } from "../math/rect";
import { RenderObjectSprite } from "./objects/RenderObjectSprite";
import { FillStyleKind } from "../../classes/_internal/character/styles";
import { RenderTexture } from "./Texture";
import type { RenderContext } from "./RenderContext";
import { Renderbuffer } from "./Renderbuffer";

function nextPow2(n: number) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

export class RenderTarget {
  #gl?: WebGLRenderingContext;

  renderBuffer = new Renderbuffer(0, 0, false);
  depthBuffer = new Renderbuffer(0, 0, true);
  texture = new RenderTexture(0, 0);
  textureAux1 = new RenderTexture(0, 0);
  textureAux2 = new RenderTexture(0, 0);
  viewport = rect.create();

  #texWidth = 0;
  #texHeight = 0;
  #uvMat = mat2d.create();

  #renderObject = new RenderObjectSprite({
    vertices: new Float32Array(12),
    uvMatrix: this.#uvMat,
    texture: this.texture,
    color: null,
    fillMode: FillStyleKind.ClippedBitmap,
    bounds: rect.create(),
  });

  get renderMatrix() {
    return this.#renderObject.renderMatrix;
  }
  get colorMul() {
    return this.#renderObject.colorMul;
  }
  get colorAdd() {
    return this.#renderObject.colorAdd;
  }

  resize(
    gl: WebGLRenderingContext,
    viewport: rect,
    padX: number,
    padY: number
  ) {
    this.#gl = gl;
    let needReRender = false;

    padX = Math.ceil(padX);
    padY = Math.ceil(padY);

    let [x, y, width, height] = viewport;
    x -= padX;
    y -= padY;
    width += padX * 2;
    height += padY * 2;

    const texWidth = nextPow2(width);
    const texHeight = nextPow2(height);
    if (this.#texWidth !== texWidth || this.#texHeight !== texHeight) {
      this.delete();
      this.renderBuffer.width = texWidth;
      this.renderBuffer.height = texHeight;
      this.depthBuffer.width = texWidth;
      this.depthBuffer.height = texHeight;
      this.texture.width = texWidth;
      this.texture.height = texHeight;
      this.textureAux1.width = texWidth;
      this.textureAux1.height = texHeight;
      this.textureAux2.width = texWidth;
      this.textureAux2.height = texHeight;
      this.#texWidth = texWidth;
      this.#texHeight = texHeight;
      needReRender = true;
    }

    this.viewport[0] = Math.floor(x);
    this.viewport[1] = Math.floor(y);
    this.viewport[2] = texWidth;
    this.viewport[3] = texHeight;

    mat2d.identity(this.#uvMat);
    mat2d.scale(this.#uvMat, this.#uvMat, [1 / texWidth, 1 / texHeight]);
    mat2d.translate(this.#uvMat, this.#uvMat, [padX, padY]);

    this.#renderObject.def.vertices.set([
      width,
      -padY,
      -padX,
      height,
      -padX,
      -padY,
      -padX,
      height,
      width,
      -padY,
      width,
      height,
    ]);
    this.#renderObject.def.bounds[0] = -padX;
    this.#renderObject.def.bounds[1] = -padY;
    this.#renderObject.def.bounds[2] = width;
    this.#renderObject.def.bounds[3] = height;

    return needReRender;
  }

  delete() {
    if (!this.#gl) {
      return;
    }
    this.renderBuffer.delete(this.#gl);
    this.depthBuffer.delete(this.#gl);
    this.texture.delete(this.#gl);
    this.textureAux1.delete(this.#gl);
    this.textureAux2.delete(this.#gl);
  }

  renderTo(ctx: RenderContext) {
    ctx.render(this.#renderObject);
  }
}
