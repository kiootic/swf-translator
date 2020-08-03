export class Renderbuffer {
  gl?: WebGLRenderbuffer;
  dirty = true;
  width: number;
  height: number;

  constructor(width: number, height: number, readonly isDepth: boolean) {
    this.width = width;
    this.height = height;
  }

  ensure(gl: WebGL2RenderingContext): WebGLRenderbuffer {
    if (this.dirty && this.gl) {
      gl.deleteRenderbuffer(this.gl);
      this.gl = undefined;
    }

    if (!this.gl) {
      const rb = gl.createRenderbuffer();
      if (!rb) {
        throw new Error("Cannot create texture");
      }
      this.gl = rb;

      gl.bindRenderbuffer(gl.RENDERBUFFER, this.gl);
      gl.renderbufferStorageMultisample(
        gl.RENDERBUFFER,
        gl.getParameter(gl.MAX_SAMPLES),
        this.isDepth ? gl.DEPTH_COMPONENT16 : gl.RGBA8,
        this.width,
        this.height
      );

      this.dirty = false;
    }

    return this.gl;
  }

  markDirty() {
    this.dirty = true;
  }

  delete(gl: WebGLRenderingContext) {
    if (this.gl) {
      gl.deleteRenderbuffer(this.gl);
    }
    this.gl = undefined;
    this.dirty = true;
  }
}
