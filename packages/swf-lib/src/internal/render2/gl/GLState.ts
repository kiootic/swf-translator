import { vec4 } from "gl-matrix";

export class GLState {
  readonly gl: WebGL2RenderingContext;

  readonly maxTextures: number;
  readonly clearColor = vec4.create();
  readonly bindings = new Map<GLenum, unknown>();
  readonly textureUnits = new Map<number, WebGLTexture | null>();
  activeTexture: GLenum = 0;
  vertexArray: WebGLVertexArrayObject | null = null;
  program: WebGLProgram | null = null;
  capacity: number = 0;
  readonly blendEquation: [GLenum, GLenum] = [0, 0];
  readonly blendFuncs: [GLenum, GLenum, GLenum, GLenum] = [0, 0, 0, 0];

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly attrs: WebGLContextAttributes
  ) {
    const gl = canvas.getContext("webgl2", attrs);
    if (!gl) {
      throw new Error("Cannot create WebGL2 context");
    }
    this.gl = gl;

    this.maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  }

  bindTexture(unit: number, texture: WebGLTexture | null) {
    if (this.textureUnits.get(unit) === texture) {
      return;
    }
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.textureUnits.set(unit, texture);
  }

  bindTextures(textures: (WebGLTexture | null)[]): GLenum[] {
    const units: GLenum[] = [];
    for (const tex of textures) {
      let found = false;
      for (const [unit, unitTex] of this.textureUnits) {
        if (unitTex === tex) {
          units.push(unit);
          found = true;
          break;
        }
      }
      if (found) {
        continue;
      }

      for (let unit = 0; unit < this.maxTextures; unit++) {
        const unitTex = this.textureUnits.get(unit);
        if (!unitTex || !textures.includes(unitTex)) {
          this.bindTexture(unit, tex);
          units.push(unit);
          found = true;
          break;
        }
      }
      if (found) {
        continue;
      }

      throw new Error("Failed to bind texture");
    }
    return units;
  }

  bindBuffer(target: GLenum, buffer: WebGLBuffer | null) {
    if (this.bindings.get(target) === buffer) {
      return;
    }
    this.gl.bindBuffer(target, buffer);
    this.bindings.set(target, buffer);
  }

  bindVertexArray(va: WebGLVertexArrayObject | null) {
    if (this.vertexArray === va) {
      return;
    }
    this.gl.bindVertexArray(va);
    this.vertexArray = va;
    this.bindings.clear();
  }

  bindRenderbuffer(target: GLenum, renderbuffer: WebGLRenderbuffer | null) {
    if (this.bindings.get(target) === renderbuffer) {
      return;
    }
    this.gl.bindRenderbuffer(target, renderbuffer);
    this.bindings.set(target, renderbuffer);
  }

  bindFramebuffer(target: GLenum, framebuffer: WebGLFramebuffer | null) {
    if (this.bindings.get(target) === framebuffer) {
      return;
    }
    this.gl.bindFramebuffer(target, framebuffer);
    this.bindings.set(target, framebuffer);
  }

  useProgram(program: WebGLProgram | null) {
    if (this.program === program) {
      return;
    }
    this.gl.useProgram(program);
    this.program = program;
  }

  setActiveTexture(texture: GLenum) {
    if (this.activeTexture === texture) {
      return;
    }
    this.gl.activeTexture(texture);
    this.activeTexture = texture;
  }

  setClearColor(red: number, green: number, blue: number, alpha: number) {
    if (vec4.equals(this.clearColor, [red, green, blue, alpha])) {
      return;
    }
    this.gl.clearColor(red, green, blue, alpha);
    vec4.set(this.clearColor, red, green, blue, alpha);
  }

  enable(cap: GLenum) {
    if ((this.capacity | cap) === this.capacity) {
      return;
    }
    this.gl.enable(cap);
    this.capacity |= cap;
  }

  disable(cap: GLenum) {
    if ((this.capacity & ~cap) === this.capacity) {
      return;
    }
    this.gl.disable(cap);
    this.capacity &= ~cap;
  }

  setBlendEquation(modeRGB: GLenum, modeAlpha: GLenum = modeRGB) {
    if (
      this.blendEquation[0] === modeRGB &&
      this.blendEquation[1] === modeAlpha
    ) {
      return;
    }
    this.gl.blendEquationSeparate(modeRGB, modeAlpha);
    this.blendEquation[0] = modeRGB;
    this.blendEquation[1] = modeAlpha;
  }

  setBlendFunc(
    srcRGB: GLenum,
    dstRGB: GLenum,
    srcAlpha: GLenum = srcRGB,
    dstAlpha: GLenum = dstRGB
  ) {
    if (
      this.blendFuncs[0] === srcRGB &&
      this.blendFuncs[1] === dstRGB &&
      this.blendFuncs[2] === srcAlpha &&
      this.blendFuncs[3] === dstAlpha
    ) {
      return;
    }
    this.gl.blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha);
    this.blendFuncs[0] = srcRGB;
    this.blendFuncs[1] = dstRGB;
    this.blendFuncs[2] = srcAlpha;
    this.blendFuncs[3] = dstAlpha;
  }
}
