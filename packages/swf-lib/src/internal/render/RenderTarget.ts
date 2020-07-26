import { mat2d } from "gl-matrix";
import { rect } from "../math/rect";
import { RenderObjectSprite, BlendMode } from "./objects/RenderObjectSprite";
import { FillStyleKind } from "../../classes/_internal/character/styles";
import { RenderTexture } from "./Texture";
import type { RenderContext } from "./RenderContext";
import { Renderbuffer } from "./Renderbuffer";

function nextPow2(n: number) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

export class RenderTarget {
  renderBuffer = new Renderbuffer(0, 0);
  tex1 = new RenderTexture(0, 0);
  tex2 = new RenderTexture(0, 0);

  #texWidth = 0;
  #texHeight = 0;
  #uvMat = mat2d.create();

  #renderObject = new RenderObjectSprite({
    vertices: new Float32Array(12),
    uvMatrix: this.#uvMat,
    texture: this.tex1,
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

  constructor() {
    this.#renderObject.blendMode = BlendMode.NormalPM;
  }

  resize(gl: WebGLRenderingContext, width: number, height: number) {
    let resized = false;

    const w = nextPow2(width / 20);
    const h = nextPow2(height / 20);
    if (this.#texWidth !== w || this.#texHeight !== h) {
      this.delete(gl);
      this.tex1.width = w;
      this.tex1.height = h;
      this.tex2.width = w;
      this.tex2.height = h;
      this.renderBuffer.width = w;
      this.renderBuffer.height = h;
      this.#texWidth = w;
      this.#texHeight = h;
      resized = true;
    }

    const texWidth = w * 20;
    const texHeight = h * 20;
    mat2d.fromScaling(this.#uvMat, [1 / texWidth, -1 / texHeight]);
    mat2d.translate(this.#uvMat, this.#uvMat, [0, -texHeight]);

    this.#renderObject.def.vertices.set([
      width,
      0,
      0,
      height,
      0,
      0,
      0,
      height,
      width,
      0,
      width,
      height,
    ]);
    this.#renderObject.def.bounds[2] = width;
    this.#renderObject.def.bounds[3] = height;

    return resized;
  }

  delete(gl: WebGLRenderingContext) {
    this.renderBuffer.delete(gl);
    this.tex1.delete(gl);
    this.tex2.delete(gl);
  }

  swap() {
    const tex2 = this.tex2;
    this.tex2 = this.tex1;
    this.tex1 = tex2;
  }

  renderTo(ctx: RenderContext) {
    ctx.render(this.#renderObject);
  }
}
