import { GLState } from "./GLState";
import { Uniform } from "./Uniform";

export class Program {
  readonly vertexShader: string;
  readonly fragmentShader: string;

  state: GLState | null = null;
  program: WebGLProgram | null = null;
  private readonly uniforms = new Map<string, Uniform>();

  constructor(vertexShader: string, fragmentShader: string) {
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
  }

  ensure(state: GLState) {
    if (this.program) {
      return;
    }
    const gl = state.gl;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, this.vertexShader.trim());
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(vertexShader);
      gl.deleteShader(vertexShader);
      throw new Error("Cannot compile vertex shader: " + log);
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, this.fragmentShader.trim());
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(fragmentShader);
      gl.deleteShader(fragmentShader);
      throw new Error("Cannot compile fragment shader: " + log);
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error("Cannot link program: " + log);
    }

    this.uniforms.clear();
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < numUniforms; ++i) {
      const info = gl.getActiveUniform(program, i)!;
      const location = gl.getUniformLocation(program, info.name)!;
      this.uniforms.set(info.name, new Uniform(state, info, location));
    }

    this.program = program;
    this.state = state;

    state.contextLost.subscribe(this.onContextLost);
  }

  uniform(state: GLState, name: string, value: unknown) {
    this.ensure(state);
    const uniform = this.uniforms.get(name);
    if (!uniform) {
      return;
    }
    uniform.set(this.program, value);
  }

  private onContextLost = () => {
    if (this.state) {
      this.state.contextLost.unsubscribe(this.onContextLost);
      this.state = null;
    }
    this.program = null;
  };
}
