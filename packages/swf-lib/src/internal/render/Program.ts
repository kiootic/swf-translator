import { Shader, AttributeType, UniformType } from "./Shader";
import { Buffer } from "./Buffer";

export class Program {
  gl?: WebGLProgram;
  readonly attribLocs = new Map<string, [AttributeType, number]>();
  readonly uniformLocs = new Map<string, [UniformType, WebGLUniformLocation]>();

  constructor(readonly vertShader: Shader, readonly fragShader: Shader) {}

  ensure(gl: WebGLRenderingContext): WebGLProgram {
    if (this.gl) {
      return this.gl;
    }

    const program = gl.createProgram();
    if (!program) {
      throw new Error("Cannot create program");
    }

    gl.attachShader(program, this.vertShader.ensure(gl));
    gl.attachShader(program, this.fragShader.ensure(gl));
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error("Cannot link program: " + log);
    }

    this.attribLocs.clear();
    for (const [name, type] of [
      ...this.vertShader.attributes,
      ...this.fragShader.attributes,
    ]) {
      const l = gl.getAttribLocation(program, name);
      if (l < 0) {
        throw new Error(`Attribute ${name} does not exist`);
      }
      this.attribLocs.set(name, [type, l]);
    }

    this.uniformLocs.clear();
    for (const [name, type] of [
      ...this.vertShader.uniforms,
      ...this.fragShader.uniforms,
    ]) {
      const l = gl.getUniformLocation(program, name);
      if (!l) {
        throw new Error(`Uniform ${name} does not exist`);
      }
      this.uniformLocs.set(name, [type, l]);
    }

    this.gl = program;
    return this.gl;
  }

  delete(gl: WebGLRenderingContext) {
    if (this.gl) {
      gl.deleteProgram(this.gl);
    }
    this.gl = undefined;
    this.attribLocs.clear();
    this.uniformLocs.clear();
  }

  setAttr(gl: WebGL2RenderingContext, name: string, value: Buffer) {
    const entry = this.attribLocs.get(name);
    if (!entry) {
      throw new Error(`Attribute ${name} does not exist`);
    }

    const [{ components, type, normalized }, location] = entry;
    const buf = value.ensure(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);

    const glType = {
      float: gl.FLOAT,
      byte: gl.UNSIGNED_BYTE,
    }[type];

    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(
      location,
      components,
      glType,
      normalized ?? false,
      0,
      0
    );
  }

  setUniform(gl: WebGLRenderingContext, name: string, value: unknown) {
    const entry = this.uniformLocs.get(name);
    if (!entry) {
      throw new Error(`Uniform ${name} does not exist`);
    }

    const [type, location] = entry;

    switch (type) {
      case "vec2":
        gl.uniform2fv(location, value as Float32List);
        break;

      case "vec4":
        gl.uniform4fv(location, value as Float32List);
        break;

      case "mat3":
        gl.uniformMatrix3fv(location, false, value as Float32List);
        break;

      case "float":
        gl.uniform1f(location, value as number);
        break;

      case "int":
        gl.uniform1i(location, value as number);
        break;

      case "intlist":
        gl.uniform1iv(location, value as Int32List);
        break;
    }
  }
}
