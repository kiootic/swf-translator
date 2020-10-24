import { vec4 } from "gl-matrix";
import { Signal } from "../../signal";

export class GLState {
  readonly gl: WebGL2RenderingContext;
  readonly resetRender = new Signal<(state: GLState) => void>();

  maxTextures = 1;
  textureLimit = 16;
  maxSamples = 0;
  sampleLimit = 4;

  readonly clearColor = vec4.fromValues(NaN, NaN, NaN, NaN);
  readonly viewport = vec4.fromValues(NaN, NaN, NaN, NaN);
  readonly bindings = new Map<GLenum, unknown>();
  readonly textureUnits = new Map<number, WebGLTexture | null>();
  activeTexture: GLenum = NaN;
  vertexArray: WebGLVertexArrayObject | null = null;
  program: WebGLProgram | null = null;
  capacity: number = NaN;
  readonly blendEquation: [GLenum, GLenum] = [NaN, NaN];
  readonly blendFuncs: [GLenum, GLenum, GLenum, GLenum] = [NaN, NaN, NaN, NaN];

  readonly instances = new Map<unknown, unknown>();

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly attrs: WebGLContextAttributes
  ) {
    const gl = canvas.getContext("webgl2", attrs);
    if (!gl) {
      throw new Error("Cannot create WebGL2 context");
    }
    this.gl = gl;
    canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
      },
      false
    );
    canvas.addEventListener(
      "webglcontextrestored",
      (e) => {
        e.preventDefault();
        this.instances.clear();
        this.resetRender.reset();
        this.reset();
      },
      false
    );

    this.reset();
  }

  reset() {
    this.maxTextures = Math.min(
      this.textureLimit,
      this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS)
    );
    this.maxSamples = Math.min(
      this.sampleLimit,
      this.gl.getParameter(this.gl.MAX_SAMPLES)
    );
    vec4.set(this.clearColor, NaN, NaN, NaN, NaN);
    vec4.set(this.viewport, NaN, NaN, NaN, NaN);
    this.bindings.clear();
    this.textureUnits.clear();
    this.activeTexture = NaN;
    this.vertexArray = null;
    this.program = null;
    this.capacity = NaN;
    this.blendEquation.fill(NaN);
    this.blendFuncs.fill(NaN);
  }

  resetRenderState() {
    this.reset();
    this.resetRender.emit(this);
  }

  lookupInstance<T>(key: unknown): T | undefined {
    return this.instances.get(key) as T;
  }

  ensureInstance<T>(
    key: unknown,
    factory: (gl: WebGL2RenderingContext) => T
  ): T {
    let value = this.instances.get(key) as T;
    if (!value) {
      value = factory(this.gl);
      this.instances.set(key, value);
    }
    return value;
  }

  deleteInstance<T>(
    key: unknown,
    deleteFn: (gl: WebGL2RenderingContext, obj: T) => void
  ) {
    let value = this.instances.get(key) as T;
    if (!value) {
      return;
    }
    deleteFn(this.gl, value);
    this.instances.delete(key);
  }

  // FIXME: Disabled bound texture unit memorization since it's crashy on macOS.
  // ref: https://stackoverflow.com/questions/34277156/webgl-on-osx-using-wrong-texture-in-all-browsers
  bindTexture(unit: number, texture: WebGLTexture | null) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.textureUnits.set(unit, texture);
  }

  bindTextures(textures: (WebGLTexture | null)[]): GLenum[] {
    return textures.map((tex, i) => {
      this.bindTexture(i, tex);
      return i;
    });
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
    if (target === this.gl.FRAMEBUFFER) {
      this.bindings.set(this.gl.FRAMEBUFFER, framebuffer);
      this.bindings.set(this.gl.READ_FRAMEBUFFER, framebuffer);
      this.bindings.set(this.gl.DRAW_FRAMEBUFFER, framebuffer);
    } else if (target === this.gl.READ_FRAMEBUFFER) {
      this.bindings.set(this.gl.FRAMEBUFFER, undefined);
      this.bindings.set(this.gl.READ_FRAMEBUFFER, framebuffer);
    } else if (target === this.gl.DRAW_FRAMEBUFFER) {
      this.bindings.set(this.gl.FRAMEBUFFER, undefined);
      this.bindings.set(this.gl.DRAW_FRAMEBUFFER, framebuffer);
    }
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

  setViewport(x: number, y: number, width: number, height: number) {
    if (vec4.equals(this.viewport, [x, y, width, height])) {
      return;
    }
    this.gl.viewport(x, y, width, height);
    vec4.set(this.viewport, x, y, width, height);
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
