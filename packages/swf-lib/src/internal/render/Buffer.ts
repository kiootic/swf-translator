export interface TypedArray extends ArrayBufferView {
  readonly BYTES_PER_ELEMENT: number;
  readonly length: number;

  slice(start?: number, end?: number): this;
}

export class Buffer<T extends TypedArray = TypedArray> {
  gl?: WebGLBuffer;
  dirty = true;

  readonly data: T;
  #length: number;

  get length() {
    return this.#length;
  }

  constructor(data: T) {
    this.data = data;
    this.#length = data.length;
  }

  ensure(gl: WebGL2RenderingContext): WebGLBuffer {
    if (!this.gl) {
      const buffer = gl.createBuffer();
      if (!buffer) {
        throw new Error("Cannot create buffer");
      }
      this.gl = buffer;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gl);
      gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.DYNAMIC_DRAW);
    }

    if (this.dirty) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gl);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data, 0, this.#length);
      this.dirty = false;
    }

    return this.gl;
  }

  markDirty(length: number) {
    this.#length = length;
    this.dirty = true;
  }

  delete(gl: WebGLRenderingContext) {
    if (this.gl) {
      gl.deleteBuffer(this.gl);
    }
    this.gl = undefined;
    this.dirty = true;
  }
}
