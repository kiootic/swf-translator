import { GLState } from "./GLState";

export class Renderbuffer {
  readonly width: number;
  readonly height: number;

  state: GLState | null = null;
  renderbuffer: WebGLRenderbuffer | null = null;

  constructor(
    width: number,
    height: number,
    readonly type: "depth" | "rgba" | "rgb"
  ) {
    this.width = width;
    this.height = height;
  }

  ensure(state: GLState) {
    if (this.renderbuffer) {
      return;
    }
    const gl = state.gl;

    let glFormat: GLenum;
    switch (this.type) {
      case "depth":
        glFormat = gl.DEPTH_COMPONENT16;
        break;
      case "rgba":
        glFormat = gl.RGBA8;
        break;
      case "rgb":
        glFormat = gl.RGB8;
        break;
    }

    const rb = gl.createRenderbuffer();
    state.bindRenderbuffer(gl.RENDERBUFFER, rb);
    if (state.maxSamples > 0) {
      gl.renderbufferStorageMultisample(
        gl.RENDERBUFFER,
        state.maxSamples,
        glFormat,
        this.width,
        this.height
      );
    } else {
      gl.renderbufferStorage(
        gl.RENDERBUFFER,
        glFormat,
        this.width,
        this.height
      );
    }

    this.state = state;
    this.renderbuffer = rb;

    state.contextLost.subscribe(this.onContextLost);
    state.resetRender.subscribe(this.onResetRender);
  }

  delete() {
    if (!this.state) {
      return;
    }
    this.state.gl.deleteRenderbuffer(this.renderbuffer);
    this.state.contextLost.unsubscribe(this.onContextLost);
    this.state.resetRender.unsubscribe(this.onResetRender);
    this.state = null;
    this.renderbuffer = null;
  }

  private onContextLost = () => {
    if (this.state) {
      this.state.contextLost.unsubscribe(this.onContextLost);
      this.state.resetRender.unsubscribe(this.onResetRender);
      this.state = null;
    }
    this.renderbuffer = null;
  };

  private onResetRender = () => {
    this.delete();
  };
}
