import { GLState } from "./GLState";
import { Uniform } from "./Uniform";

interface ProgramState {
  program: WebGLProgram;
  uniforms: Map<string, Uniform>;
}

export class Program {
  readonly vertexShader: string;
  readonly fragmentShader: string;

  constructor(vertexShader: string, fragmentShader: string) {
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
  }

  ensure(state: GLState) {
    return this.doEnsure(state).program;
  }

  private doEnsure(state: GLState) {
    return state.ensureInstance<ProgramState>(this, (gl) => {
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

      const uniforms = new Map<string, Uniform>();
      const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < numUniforms; ++i) {
        const info = gl.getActiveUniform(program, i)!;
        const location = gl.getUniformLocation(program, info.name)!;
        uniforms.set(info.name, new Uniform(state, info, location));
      }

      return { program, uniforms };
    });
  }

  uniform(state: GLState, name: string, value: unknown) {
    const { program, uniforms } = this.doEnsure(state);
    const uniform = uniforms.get(name);
    if (!uniform) {
      return;
    }
    uniform.set(program, value);
  }
}
