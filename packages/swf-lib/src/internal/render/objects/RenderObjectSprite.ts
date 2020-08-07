import { mat2d, mat3, vec2, vec4 } from "gl-matrix";
import { rect } from "../../math/rect";
import { programSprite } from "../shaders";
import { RenderObjectProgram, RenderObject } from "../RenderObject";
import { Buffer } from "../Buffer";
import { Viewport } from "../Viewport";
import { GLTexture, RenderTexture } from "../Texture";

export interface SpriteDef {
  vertices: Float32Array;
  uvMatrix: mat2d;
  texture: GLTexture;
  color: vec4 | null;
  fillMode: number;
  bounds: rect;
}

export enum BlendMode {
  Normal,
}

export class RenderObjectSprite implements RenderObject {
  readonly program = RenderObjectSpriteProgram.instance;

  readonly renderMatrix = mat2d.identity(mat2d.create());
  readonly colorMul = vec4.fromValues(1, 1, 1, 1);
  readonly colorAdd = vec4.fromValues(0, 0, 0, 0);
  blendMode: BlendMode = BlendMode.Normal;

  constructor(readonly def: SpriteDef) {}

  getBounds(bounds: rect): void {
    rect.apply(bounds, this.def.bounds, this.renderMatrix);
  }

  hitTest(x: number, y: number): boolean {
    // https://stackoverflow.com/a/2049593
    const sign = (ax: number, ay: number, bx: number, by: number) => {
      return (x - bx) * (ay - by) - (ax - bx) * (y - by);
    };

    const vertices = this.def.vertices;
    const numTriangles = vertices.length / 6;
    for (let i = 0; i < numTriangles; i++) {
      const ax = vertices[i * 6 + 0];
      const ay = vertices[i * 6 + 1];
      const bx = vertices[i * 6 + 2];
      const by = vertices[i * 6 + 3];
      const cx = vertices[i * 6 + 4];
      const cy = vertices[i * 6 + 5];

      const d1 = sign(ax, ay, bx, by);
      const d2 = sign(bx, by, cx, cy);
      const d3 = sign(cx, cy, ax, ay);

      const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
      const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;
      if (!hasNegative || !hasPositive) {
        return true;
      }
    }
    return false;
  }
}

const batchVertexSize = 0x20000;

class RenderObjectSpriteProgram
  implements RenderObjectProgram<RenderObjectSprite> {
  static readonly instance = new RenderObjectSpriteProgram();

  private numVertex = 0;
  private depth = 0;
  private projectionMatrix = mat3.create();
  private blendMode: BlendMode = BlendMode.Normal;
  private readonly textures: GLTexture[] = [];
  private readonly texIDs = new Uint8Array(8);
  private readonly vertices = new Buffer(new Float32Array(batchVertexSize * 4));
  private readonly colorTint = new Buffer(new Uint32Array(batchVertexSize));
  private readonly colorMul = new Buffer(new Float32Array(batchVertexSize * 4));
  private readonly colorAdd = new Buffer(new Float32Array(batchVertexSize * 4));
  private readonly modes = new Buffer(new Uint8Array(batchVertexSize));

  private constructor() {}

  private reset() {
    this.numVertex = 0;
    this.textures.length = 0;
  }

  render(
    gl: WebGL2RenderingContext,
    depth: number,
    viewport: Viewport,
    objects: RenderObjectSprite[]
  ): void {
    this.reset();
    mat3.copy(this.projectionMatrix, viewport.matrix);
    this.depth = depth;

    const vertices = this.vertices.data;
    const colorTint = this.colorTint.data;
    const colorAdd = this.colorAdd.data;
    const colorMul = this.colorMul.data;

    const cMul = vec4.create();
    const cAdd = vec4.create();
    const bounds = rect.create();
    for (const o of objects) {
      if (this.blendMode != o.blendMode) {
        this.flushBatch(gl);
        this.blendMode = o.blendMode;
      }

      const numVertex = o.def.vertices.length / 2;
      if (this.numVertex + numVertex > batchVertexSize) {
        this.flushBatch(gl);
      }

      if (!this.textures.includes(o.def.texture)) {
        if (this.textures.length >= 8) {
          this.flushBatch(gl);
        }
        this.textures.push(o.def.texture);
      }

      const textureId = this.textures.indexOf(o.def.texture);
      const mode = o.def.fillMode * 8 + textureId;

      const renderMatrix = o.renderMatrix;
      const uvMatrix = o.def.uvMatrix;

      const tint = o.def.color
        ? Math.round(o.def.color[3] * 255) * 0x1000000 +
          Math.round(o.def.color[2] * 255) * 0x10000 +
          Math.round(o.def.color[1] * 255) * 0x100 +
          Math.round(o.def.color[0] * 255) * 0x1
        : 0xffffffff;
      vec4.copy(cMul, o.colorMul);
      vec4.copy(cAdd, o.colorAdd);
      vec4.scale(cAdd, cAdd, 1 / 255);

      const base = this.numVertex;
      const oVertices = o.def.vertices;
      let j = base * 4;
      for (let i = 0; i < numVertex; i++) {
        const x = oVertices[i * 2 + 0];
        const y = oVertices[i * 2 + 1];

        vertices[j + 0] =
          renderMatrix[0] * x + renderMatrix[2] * y + renderMatrix[4];
        vertices[j + 1] =
          renderMatrix[1] * x + renderMatrix[3] * y + renderMatrix[5];
        vertices[j + 2] = uvMatrix[0] * x + uvMatrix[2] * y + uvMatrix[4];
        vertices[j + 3] = uvMatrix[1] * x + uvMatrix[3] * y + uvMatrix[5];

        colorTint[base + i] = tint;

        colorMul[j + 0] = cMul[0];
        colorMul[j + 1] = cMul[1];
        colorMul[j + 2] = cMul[2];
        colorMul[j + 3] = cMul[3];

        colorAdd[j + 0] = cAdd[0];
        colorAdd[j + 1] = cAdd[1];
        colorAdd[j + 2] = cAdd[2];
        colorAdd[j + 3] = cAdd[3];

        j += 4;
      }

      this.modes.data.fill(mode, base, base + numVertex);

      this.numVertex += numVertex;
    }

    this.flushBatch(gl);
  }

  private flushBatch(gl: WebGL2RenderingContext) {
    if (this.numVertex === 0) {
      return;
    }

    this.vertices.markDirty(this.numVertex * 4);
    this.colorTint.markDirty(this.numVertex);
    this.colorMul.markDirty(this.numVertex * 4);
    this.colorAdd.markDirty(this.numVertex * 4);
    this.modes.markDirty(this.numVertex);

    gl.blendEquation(gl.FUNC_ADD);
    switch (this.blendMode) {
      case BlendMode.Normal:
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        break;
    }

    const textures = this.textures.map((tex) => tex.ensure(gl));

    gl.useProgram(programSprite.ensure(gl));

    this.texIDs.fill(0);
    for (let i = 0; i < textures.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, textures[i]);
      this.texIDs[i] = i;
    }

    programSprite.setUniform(gl, "uProjectionMatrix", this.projectionMatrix);
    programSprite.setUniform(gl, "uTex", this.texIDs);
    programSprite.setUniform(gl, "uDepth", this.depth);
    programSprite.setAttr(gl, "aVertex", this.vertices);
    programSprite.setAttr(gl, "aColorTint", this.colorTint);
    programSprite.setAttr(gl, "aColorMul", this.colorMul);
    programSprite.setAttr(gl, "aColorAdd", this.colorAdd);
    programSprite.setAttr(gl, "aMode", this.modes);
    gl.drawArrays(gl.TRIANGLES, 0, this.numVertex);

    this.reset();
  }
}
