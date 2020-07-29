export enum ShaderKind {
  Vertex,
  Fragment,
}

export interface AttributeType {
  components: number;
  type: "float" | "byte";
  normalized?: boolean;
}

export type UniformType =
  | "vec2"
  | "vec4"
  | "mat3"
  | "float"
  | "int"
  | "intlist";

export interface ShaderDescriptor {
  kind: ShaderKind;
  attributes: Record<string, AttributeType>;
  uniforms: Record<string, UniformType>;
}

export class Shader {
  gl?: WebGLShader;

  constructor(readonly source: string, readonly descriptor: ShaderDescriptor) {}

  static vertex(
    source: string,
    attributes: Record<string, AttributeType> = {},
    uniforms: Record<string, UniformType> = {}
  ) {
    return new Shader(source.trim(), {
      kind: ShaderKind.Vertex,
      attributes,
      uniforms,
    });
  }

  static fragment(source: string, uniforms: Record<string, UniformType> = {}) {
    return new Shader(source.trim(), {
      kind: ShaderKind.Fragment,
      attributes: {},
      uniforms,
    });
  }

  get attributes() {
    return Object.entries(this.descriptor.attributes);
  }
  get uniforms() {
    return Object.entries(this.descriptor.uniforms);
  }

  ensure(gl: WebGLRenderingContext): WebGLProgram {
    if (this.gl) {
      return this.gl;
    }

    let type: number;
    switch (this.descriptor.kind) {
      case ShaderKind.Vertex:
        type = gl.VERTEX_SHADER;
        break;
      case ShaderKind.Fragment:
        type = gl.FRAGMENT_SHADER;
        break;
    }

    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error("Cannot create shader");
    }

    gl.shaderSource(shader, this.source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error("Cannot compile shader: " + log);
    }

    this.gl = shader;
    return this.gl;
  }

  delete(gl: WebGLRenderingContext) {
    if (this.gl) {
      gl.deleteShader(this.gl);
    }
    this.gl = undefined;
  }
}
