import { GLState } from "./GLState";
import { Buffer } from "./Buffer";

interface VertexArrayAttribute {
  index: number;
  buffer: Buffer;
  type: "byte" | "ushort" | "uint" | "float";
  components: number;
  normalized?: boolean;
  stride?: number;
  offset?: number;
  integer?: boolean;
}

export class VertexArray {
  state: GLState | null = null;
  vertexArray: WebGLVertexArrayObject | null = null;

  attributes: VertexArrayAttribute[];
  indexBuffer: Buffer | null = null;

  constructor(
    attributes: VertexArrayAttribute[],
    indexBuffer: Buffer | null = null
  ) {
    this.attributes = attributes;
    this.indexBuffer = indexBuffer;
  }

  ensure(state: GLState) {
    if (this.vertexArray) {
      return;
    }
    const gl = state.gl;

    const vertexArray = gl.createVertexArray();
    state.bindVertexArray(vertexArray);

    if (this.indexBuffer) {
      this.indexBuffer.ensure(state);
      state.bindBuffer(gl[this.indexBuffer.binding], this.indexBuffer.buffer);
    }

    for (const attr of this.attributes) {
      const {
        index,
        buffer,
        type,
        components,
        normalized = false,
        stride = 0,
        offset = 0,
        integer = false,
      } = attr;

      let glType: GLenum;
      switch (type) {
        case "byte":
          glType = gl.UNSIGNED_BYTE;
          break;
        case "ushort":
          glType = gl.UNSIGNED_SHORT;
          break;
        case "uint":
          glType = gl.UNSIGNED_INT;
          break;
        case "float":
          glType = gl.FLOAT;
          break;
      }

      buffer.ensure(state);
      state.bindBuffer(gl[buffer.binding], buffer.buffer);
      if (integer) {
        gl.vertexAttribIPointer(index, components, glType, stride, offset);
      } else {
        gl.vertexAttribPointer(
          index,
          components,
          glType,
          normalized,
          stride,
          offset
        );
      }
      gl.enableVertexAttribArray(index);
    }

    this.vertexArray = vertexArray;
    this.state = state;
  }

  bind(state: GLState) {
    this.ensure(state);
    state.bindVertexArray(this.vertexArray);
    // HACK: Always rebind index buffer due to driver bugs:
    // ref: https://stackoverflow.com/a/11261922
    this.indexBuffer?.bind(state);
  }
}
