import { GLTexture } from "./Texture";
import { Renderbuffer } from "./Renderbuffer";

export class Framebuffer {
  gl?: WebGLFramebuffer;

  ensure(gl: WebGLRenderingContext): WebGLTexture {
    if (!this.gl) {
      const fb = gl.createFramebuffer();
      if (!fb) {
        throw new Error("Cannot create framebuffer");
      }
      this.gl = fb;
    }

    return this.gl;
  }

  delete(gl: WebGLRenderingContext) {
    if (this.gl) {
      gl.deleteFramebuffer(this.gl);
    }
    this.gl = undefined;
  }

  attachTexture(gl: WebGLRenderingContext, tex: GLTexture) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.ensure(gl));
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex.ensure(gl),
      0
    );
  }

  attachRenderbuffer(gl: WebGL2RenderingContext, rb: Renderbuffer) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.ensure(gl));
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.RENDERBUFFER,
      rb.ensure(gl)
    );
  }
}
