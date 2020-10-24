import { GLState } from "./GLState";

export class Renderbuffer {
  readonly width: number;
  readonly height: number;

  constructor(
    width: number,
    height: number,
    readonly type: "depth" | "rgba" | "rgb"
  ) {
    this.width = width;
    this.height = height;
  }

  ensure(state: GLState) {
    return state.ensureInstance(this, (gl) => {
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

      state.resetRender.subscribe(this.onResetRender);
      return rb;
    });
  }

  delete(state: GLState) {
    state.deleteInstance<WebGLRenderbuffer>(this, (gl, rb) => {
      gl.deleteRenderbuffer(rb);
      state.resetRender.unsubscribe(this.onResetRender);
    });
  }

  private onResetRender = (state: GLState) => {
    this.delete(state);
  };
}
