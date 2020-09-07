import { GLState } from "./GLState";

export class Renderbuffer {
  readonly width: number;
  readonly height: number;

  state: GLState | null = null;
  renderbuffer: WebGLRenderbuffer | null = null;

  constructor(width: number, height: number, readonly type: "depth" | "color") {
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
      case "color":
        glFormat = gl.RGBA8;
        break;
    }

    const rb = gl.createRenderbuffer();
    state.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorageMultisample(
      gl.RENDERBUFFER,
      gl.getParameter(gl.MAX_SAMPLES),
      glFormat,
      this.width,
      this.height
    );

    this.state = state;
    this.renderbuffer = rb;
  }
}
