import { GLState } from "./GLState";
import { Texture } from "./Texture";
import { Renderbuffer } from "./Renderbuffer";

export class Framebuffer {
  readonly colorAttachment: Texture | Renderbuffer;

  constructor(colorAttachment: Texture | Renderbuffer) {
    this.colorAttachment = colorAttachment;
  }

  ensure(state: GLState) {
    return state.ensureInstance(this, (gl) => {
      const attachment = this.colorAttachment.ensure(state);

      const fb = gl.createFramebuffer();
      state.bindFramebuffer(gl.DRAW_FRAMEBUFFER, fb);
      if (this.colorAttachment instanceof Texture) {
        gl.framebufferTexture2D(
          gl.DRAW_FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          attachment,
          0
        );
      } else {
        gl.framebufferRenderbuffer(
          gl.DRAW_FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.RENDERBUFFER,
          attachment
        );
      }

      state.resetRender.subscribe(this.onResetRender);
      return fb;
    });
  }

  delete(state: GLState) {
    state.deleteInstance<WebGLFramebuffer>(this, (gl, fb) => {
      gl.deleteFramebuffer(fb);
      state.resetRender.unsubscribe(this.onResetRender);
    });
  }

  private onResetRender = (state: GLState) => {
    this.delete(state);
  };
}
