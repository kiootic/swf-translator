import { mat3, mat4 } from "gl-matrix";
import { Canvas } from "./Canvas";
import { RenderContext, RenderLayer } from "./RenderContext";
import { Viewport } from "./Viewport";
import { RenderObjectProgram, RenderObject } from "./RenderObject";
import { rect } from "../math/rect";
import { Framebuffer } from "./Framebuffer";
import { RenderTarget } from "./RenderTarget";
import { Buffer } from "./Buffer";
import { Filter, FilterContext } from "./Filter";

const tmpBounds = rect.create();

export class Renderer {
  gl: WebGL2RenderingContext;
  constructor(readonly canvas: Canvas) {
    this.gl = this.canvas.getContext();
  }

  backgroundColor = 0x000000;

  framebufferRender = new Framebuffer();
  framebufferTex = new Framebuffer();

  renderFrame(fn: (ctx: RenderContext) => void) {
    const { width, height } = this.canvas;
    const projectionMat = mat3.projection(mat3.create(), width, height);
    const viewport: Viewport = {
      matrix: projectionMat,
      bounds: rect.fromValues(0, 0, width, height),
    };

    const ctx = new RenderContext(this, viewport.bounds);
    fn(ctx);
    ctx.finalize();

    const gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.viewport(0, 0, width, height);
    gl.enable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.GEQUAL);

    gl.clearColor(
      ((this.backgroundColor >>> 16) & 0xff) / 0xff,
      ((this.backgroundColor >>> 8) & 0xff) / 0xff,
      ((this.backgroundColor >>> 0) & 0xff) / 0xff,
      1
    );
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    this.renderLayer(gl, ctx.root, 1, false, viewport);

    gl.flush();
  }

  renderToTarget(target: RenderTarget, fn: (ctx: RenderContext) => void) {
    const [, , width, height] = target.viewport;
    const projectionMat = mat3.fromTranslation(mat3.create(), [-1, -1]);
    mat3.scale(projectionMat, projectionMat, [2 / width, 2 / height]);
    mat3.translate(projectionMat, projectionMat, [
      -target.viewport[0],
      -target.viewport[1],
    ]);
    const viewport: Viewport = {
      matrix: projectionMat,
      bounds: target.viewport,
    };

    const ctx = new RenderContext(this, viewport.bounds);
    fn(ctx);
    ctx.finalize();

    const gl = this.gl;

    this.framebufferRender.attachRenderbuffer(gl, target.renderBuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebufferRender.ensure(gl));

    gl.viewport(0, 0, width, height);
    gl.enable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.GEQUAL);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    this.renderLayer(gl, ctx.root, 1, false, viewport);

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

  // TODO: use correct stencil algorithm
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
        gl.depthMask(true);
        gl.depthFunc(gl.ALWAYS);
      }

      this.renderLayer(
        gl,
        layer.stencil.layer,
        layer.stencil.depth,
        true,
        viewport
      );

      if (!inStencil) {
        gl.colorMask(true, true, true, true);
        gl.depthMask(false);
        gl.depthFunc(gl.GEQUAL);
      }

      depth = layer.stencil.depth;
    }

    const objects: RenderObject[] = [];
    for (const child of layer.children) {
      if (child instanceof RenderLayer) {
        if (!rect.intersects(child.bounds, viewport.bounds)) {
          continue;
        }

        this.renderBatch(gl, objects, depth, viewport);
        objects.length = 0;

        this.renderLayer(gl, child, depth, inStencil, viewport);
      } else {
        child.getBounds(tmpBounds);
        if (!rect.intersects(tmpBounds, viewport.bounds)) {
          continue;
        }

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
    let program: RenderObjectProgram<RenderObject> | undefined;
    let begin = 0;
    for (let i = 0; i < objects.length; i++) {
      if (!program) {
        program = objects[i].program;
      }

      if (program !== objects[i].program) {
        program.render(gl, depth, viewport, objects.slice(begin, i));
        program = objects[i].program;
        begin = i;
      }
    }

    if (program) {
      program.render(gl, depth, viewport, objects.slice(begin));
    }
  }

  #filterVertices = new Buffer(Float32Array.from([0, 0, 0, 1, 1, 0, 1, 1]));

  applyFilter(target: RenderTarget, filter: Filter) {
    const context = new FilterContext(target, this.#filterVertices, this);
    filter.apply(context);
  }
}
