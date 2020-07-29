import { mat3 } from "gl-matrix";
import { Canvas } from "./Canvas";
import { RenderContext, RenderLayer } from "./RenderContext";
import { Viewport } from "./Viewport";
import { RenderObjectProgram, RenderObject } from "./RenderObject";
import { rect } from "../math/rect";
import { Framebuffer } from "./Framebuffer";
import { RenderTarget } from "./RenderTarget";
import { Buffer } from "./Buffer";
import { Filter, FilterContext } from "./Filter";

export class Renderer {
  gl: WebGL2RenderingContext;
  constructor(readonly canvas: Canvas) {
    this.gl = this.canvas.getContext();
  }

  backgroundColor = 0x000000;

  framebufferRender = new Framebuffer();
  framebufferTex = new Framebuffer();

  renderFrame(fn: (ctx: RenderContext) => void) {
    const ctx = new RenderContext(this);
    fn(ctx);
    ctx.finalize();

    const gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const { width, height } = this.canvas;
    gl.viewport(0, 0, width, height);
    gl.enable(gl.BLEND);
    gl.enable(gl.STENCIL_TEST);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

    gl.clearColor(
      ((this.backgroundColor >>> 16) & 0xff) / 0xff,
      ((this.backgroundColor >>> 8) & 0xff) / 0xff,
      ((this.backgroundColor >>> 0) & 0xff) / 0xff,
      1
    );
    gl.clear(gl.STENCIL_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    const projectionMat = mat3.projection(mat3.create(), width, height);
    const viewport: Viewport = {
      matrix: projectionMat,
      bounds: rect.fromValues(0, 0, width, height),
    };

    this.renderLayer(gl, ctx.root, 0, false, viewport);

    gl.flush();
  }

  renderToTarget(target: RenderTarget, fn: (ctx: RenderContext) => void) {
    const ctx = new RenderContext(this);
    fn(ctx);
    ctx.finalize();

    const gl = this.gl;

    this.framebufferRender.attachRenderbuffer(gl, target.renderBuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebufferRender.ensure(gl));

    const [, , width, height] = target.viewport;
    gl.viewport(0, 0, width, height);
    gl.enable(gl.BLEND);
    gl.enable(gl.STENCIL_TEST);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.STENCIL_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    const projectionMat = mat3.projection(mat3.create(), width, height);
    mat3.translate(projectionMat, projectionMat, [
      -target.viewport[0],
      -target.viewport[1],
    ]);
    const viewport: Viewport = {
      matrix: projectionMat,
      bounds: target.viewport,
    };

    this.renderLayer(gl, ctx.root, 0, false, viewport);

    gl.flush();

    this.framebufferTex.attachTexture(gl, target.texture);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.framebufferRender.ensure(gl));
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.framebufferTex.ensure(gl));
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
      gl.NEAREST
    );
  }

  private renderLayer(
    gl: WebGL2RenderingContext,
    layer: RenderLayer,
    depth: number,
    inStencil: boolean,
    viewport: Viewport
  ) {
    if (layer.stencil) {
      if (!inStencil) {
        gl.colorMask(false, false, false, false);
        gl.stencilMask(0xff);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
      }

      this.renderLayer(gl, layer.stencil.layer, depth, true, viewport);

      if (!inStencil) {
        gl.colorMask(true, true, true, true);
        gl.stencilMask(0);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      }
      depth = layer.stencil.depth;
    }

    const objects: RenderObject[] = [];
    for (const child of layer.children) {
      if (child instanceof RenderLayer) {
        this.renderBatch(gl, objects, depth, viewport);
        objects.length = 0;

        this.renderLayer(gl, child, depth, inStencil, viewport);
      } else {
        objects.push(child);
      }
    }
    this.renderBatch(gl, objects, depth, viewport);
  }

  private renderBatch(
    gl: WebGL2RenderingContext,
    objects: RenderObject[],
    depth: number,
    viewport: Viewport
  ) {
    gl.stencilFunc(gl.LEQUAL, depth, 0xff);

    let program: RenderObjectProgram<RenderObject> | undefined;
    let begin = 0;
    for (let i = 0; i < objects.length; i++) {
      if (!program) {
        program = objects[i].program;
      }

      if (program !== objects[i].program) {
        program.render(gl, viewport, depth, objects.slice(begin, i));
        program = objects[i].program;
        begin = i;
      }
    }

    if (program) {
      program.render(gl, viewport, depth, objects.slice(begin));
    }
  }

  #filterVertices = new Buffer(Float32Array.from([0, 0, 0, 1, 1, 0, 1, 1]));

  applyFilter(target: RenderTarget, filter: Filter) {
    const context = new FilterContext(target, this.#filterVertices, this);
    filter.apply(context);
  }
}
