import { GLState } from "./GLState";
import { TypedArray } from "./typed-array";

export class Buffer<T extends TypedArray = TypedArray> {
  readonly data: T;

  get length() {
    return this.data.length;
  }

  private constructor(
    data: T,
    readonly binding: "ARRAY_BUFFER" | "ELEMENT_ARRAY_BUFFER",
    readonly usage: "STATIC_DRAW" | "DYNAMIC_DRAW" | "STREAM_DRAW"
  ) {
    this.data = data;
  }

  static index<T extends TypedArray>(data: T, usage: Buffer<T>["usage"]) {
    return new Buffer(data, "ELEMENT_ARRAY_BUFFER", usage);
  }

  static vertex<T extends TypedArray>(data: T, usage: Buffer<T>["usage"]) {
    return new Buffer(data, "ARRAY_BUFFER", usage);
  }

  ensure(state: GLState) {
    return state.ensureInstance(this, (gl) => {
      const buffer = gl.createBuffer();
      state.bindBuffer(gl[this.binding], buffer);
      gl.bufferData(gl[this.binding], this.data, gl[this.usage]);

      return buffer;
    });
  }

  bind(state: GLState) {
    const buffer = this.ensure(state);
    state.bindBuffer(state.gl[this.binding], buffer);
  }

  update(state: GLState, offset: number, length: number) {
    this.bind(state);
    const gl = state.gl;
    gl.bufferSubData(gl[this.binding], 0, this.data, offset, length);
    return this;
  }
}
