import { GLState } from "./GLState";
import { Texture } from "./Texture";
import { Renderbuffer } from "./Renderbuffer";

export class Framebuffer {
  readonly colorAttachment: Texture | Renderbuffer;

  state: GLState | null = null;
  framebuffer: WebGLFramebuffer | null = null;

  constructor(colorAttachment: Texture | Renderbuffer) {
    this.colorAttachment = colorAttachment;
  }

  ensure(state: GLState) {
    if (this.framebuffer) {
      return;
    }
    const gl = state.gl;
    this.colorAttachment.ensure(state);

    const fb = gl.createFramebuffer();
    state.bindFramebuffer(gl.DRAW_FRAMEBUFFER, fb);
    if (this.colorAttachment instanceof Texture) {
      gl.framebufferTexture2D(
        gl.DRAW_FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        this.colorAttachment.texture,
        0
      );
    } else {
      gl.framebufferRenderbuffer(
        gl.DRAW_FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.RENDERBUFFER,
        this.colorAttachment.renderbuffer
      );
    }

    this.state = state;
    this.framebuffer = fb;

    state.contextLost.subscribe(this.onContextLost);
    state.resetRender.subscribe(this.onResetRender);
  }

  delete() {
    if (!this.state) {
      return;
    }
    this.state.gl.deleteFramebuffer(this.framebuffer);
    this.state.contextLost.unsubscribe(this.onContextLost);
    this.state.resetRender.unsubscribe(this.onResetRender);
    this.state = null;
    this.framebuffer = null;
  }

  private onContextLost = () => {
    if (this.state) {
      this.state.contextLost.unsubscribe(this.onContextLost);
      this.state.resetRender.unsubscribe(this.onResetRender);
      this.state = null;
    }
    this.framebuffer = null;
  };

  private onResetRender = () => {
    this.delete();
  };
}
