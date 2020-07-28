import { mat3 } from "gl-matrix";
import { Canvas } from "./Canvas";
import { RenderContext } from "./RenderContext";
import { Viewport } from "./Viewport";
import { RenderObjectProgram, RenderObject } from "./RenderObject";
import { rect } from "../math/rect";
import { Framebuffer } from "./Framebuffer";
import { GLTexture } from "./Texture";
import { Renderbuffer } from "./Renderbuffer";
import { RenderTarget } from "./RenderTarget";

export class Renderer {
  gl: WebGL2RenderingContext;
  constructor(readonly canvas: Canvas) {
    this.gl = this.canvas.getContext();
  }

  backgroundColor = 0x000000;

  #framebufferRender = new Framebuffer();
  #framebufferTex = new Framebuffer();

  renderFrame(fn: (ctx: RenderContext) => void) {
    const ctx = new RenderContext(this);
    fn(ctx);

    const gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const { width, height } = this.canvas;
    gl.viewport(0, 0, width, height);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);

    gl.clearColor(
      ((this.backgroundColor >>> 16) & 0xff) / 0xff,
      ((this.backgroundColor >>> 8) & 0xff) / 0xff,
      ((this.backgroundColor >>> 0) & 0xff) / 0xff,
      1
    );
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    const projectionMat = mat3.projection(mat3.create(), width, height);
    const viewport: Viewport = {
      matrix: projectionMat,
      bounds: rect.fromValues(0, 0, width, height),
    };

    this.renderBatch(gl, false, ctx.objects, viewport);

    gl.flush();
  }

  renderToTarget(
    target: RenderTarget,
    viewportRect: rect,
    fn: (ctx: RenderContext) => void
  ) {
    const ctx = new RenderContext(this);
    fn(ctx);

    const gl = this.gl;

    this.#framebufferRender.attachRenderbuffer(gl, target.renderBuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebufferRender.ensure(gl));

    const width = target.renderBuffer.width,
      height = target.renderBuffer.height;
    gl.viewport(0, 0, width, height);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    const projectionMat = mat3.projection(mat3.create(), width, height);
    mat3.translate(projectionMat, projectionMat, [
      -viewportRect[0],
      -viewportRect[1],
    ]);
    const viewport: Viewport = {
      matrix: projectionMat,
      bounds: viewportRect,
    };

    this.renderBatch(gl, true, ctx.objects, viewport);

    gl.flush();

    this.#framebufferTex.attachTexture(gl, target.tex1);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.#framebufferRender.ensure(gl));
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.#framebufferTex.ensure(gl));
    gl.blitFramebuffer(
      0,
      0,
      width,
      height,
      0,
      0,
      width,
      height,
      gl.COLOR_BUFFER_BIT,
      gl.LINEAR
    );
  }

  private renderBatch(
    gl: WebGL2RenderingContext,
    toTexture: boolean,
    objects: RenderObject[],
    viewport: Viewport
  ) {
    let program: RenderObjectProgram<RenderObject> | undefined;
    let begin = 0;
    for (let i = 0; i < objects.length; i++) {
      if (!program) {
        program = objects[i].program;
      }

      if (program !== objects[i].program) {
        program.render(gl, toTexture, viewport, objects.slice(begin, i));
        program = objects[i].program;
        begin = i;
      }
    }

    if (program) {
      program.render(gl, toTexture, viewport, objects.slice(begin));
    }
  }
}
