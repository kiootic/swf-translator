import { Program } from "./Program";
import { mat3 } from "gl-matrix";
import type { Renderer } from "./Renderer";
import { Buffer } from "./Buffer";
import { RenderTarget } from "./RenderTarget";
import { Renderbuffer } from "./Renderbuffer";
import { GLTexture } from "./Texture";

export interface Filter {
  readonly padX: number;
  readonly padY: number;

  apply(ctx: FilterContext): void;
}

interface FilterOptions {
  from: GLTexture;
  to: Renderbuffer | GLTexture;
  clearBuffer?: boolean;
}

export class FilterContext {
  get width() {
    return this.target.texture.width;
  }
  get height() {
    return this.target.texture.height;
  }

  private readonly projectionMatrix: mat3;

  constructor(
    readonly target: RenderTarget,
    private readonly vertices: Buffer,
    readonly renderer: Renderer
  ) {
    this.projectionMatrix = mat3.projection(mat3.create(), 1, -1);
    mat3.translate(this.projectionMatrix, this.projectionMatrix, [0, -1]);
  }

  applyFilter(
    program: Program,
    opts: FilterOptions,
    fn: (gl: WebGL2RenderingContext) => void
  ) {
    const gl = this.renderer.gl;
    const { from, to, clearBuffer = true } = opts;

    if (to instanceof Renderbuffer) {
      this.renderer.framebufferRender.attachRenderbuffer(gl, to);
    } else {
      this.renderer.framebufferRender.attachTexture(gl, to);
    }
    gl.bindFramebuffer(
      gl.FRAMEBUFFER,
      this.renderer.framebufferRender.ensure(gl)
    );

    const { width, height } = to;
    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);

    if (clearBuffer) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    }

    gl.useProgram(program.ensure(gl));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, from.ensure(gl));
    program.setUniform(gl, "uProjectionMatrix", this.projectionMatrix);
    program.setUniform(gl, "uTexture", 0);
    program.setAttr(gl, "aVertex", this.vertices);

    fn(gl);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.flush();
  }

  blit(from: Renderbuffer | GLTexture, to: Renderbuffer | GLTexture) {
    const gl = this.renderer.gl;

    if (from instanceof Renderbuffer) {
      this.renderer.framebufferRender.attachRenderbuffer(gl, from);
    } else {
      this.renderer.framebufferRender.attachTexture(gl, from);
    }
    if (to instanceof Renderbuffer) {
      this.renderer.framebufferTex.attachRenderbuffer(gl, to);
    } else {
      this.renderer.framebufferTex.attachTexture(gl, to);
    }
    gl.bindFramebuffer(
      gl.READ_FRAMEBUFFER,
      this.renderer.framebufferRender.ensure(gl)
    );
    gl.bindFramebuffer(
      gl.DRAW_FRAMEBUFFER,
      this.renderer.framebufferTex.ensure(gl)
    );
    gl.blitFramebuffer(
      0,
      0,
      from.width,
      from.height,
      0,
      0,
      to.width,
      to.height,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST
    );
  }
}
