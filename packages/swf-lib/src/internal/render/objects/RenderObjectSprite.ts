import { mat2d, mat3, vec2 } from "gl-matrix";
import { rect } from "../../math/rect";
import { programSprite } from "../shaders";
import { RenderObjectProgram, RenderObject } from "../RenderObject";
import { Buffer } from "../Buffer";
import { Screen } from "../Screen";
import { Texture } from "../Texture";

export interface SpriteDef {
  readonly vertices: Float32Array;
  readonly uvMatrix: mat2d;
  readonly texture: Texture;
  readonly tint: number;
  readonly fillMode: number;
  readonly bounds: rect;
}

export class RenderObjectSprite implements RenderObject {
  readonly program = RenderObjectSpriteProgram.instance;

  readonly renderMatrix = mat2d.identity(mat2d.create());

  constructor(readonly def: SpriteDef) {}
}

const batchVertexSize = 0x20000;

class RenderObjectSpriteProgram
  implements RenderObjectProgram<RenderObjectSprite> {
  static readonly instance = new RenderObjectSpriteProgram();

  private numVertex = 0;
  private readonly textures: Texture[] = [];
  private readonly texIDs = new Uint8Array(8);
  private readonly vertices = new Buffer(new Float32Array(batchVertexSize * 4));
  private readonly colors = new Buffer(new Uint32Array(batchVertexSize));
  private readonly modes = new Buffer(new Uint8Array(batchVertexSize));

  private constructor() {}

  private reset() {
    this.numVertex = 0;
    this.textures.length = 0;
  }

  render(
    gl: WebGL2RenderingContext,
    screen: Screen,
    objects: RenderObjectSprite[]
  ): void {
    this.reset();

    const v = vec2.create();
    const bounds = rect.create();
    for (const o of objects) {
      rect.apply(bounds, o.def.bounds, o.renderMatrix);
      if (!rect.intersects(bounds, screen.bounds)) {
        continue;
      }

      const numVertex = o.def.vertices.length / 2;
      if (this.numVertex + numVertex > batchVertexSize) {
        this.flushBatch(gl, screen.matrix);
      }

      if (!this.textures.includes(o.def.texture)) {
        if (this.textures.length >= 8) {
          this.flushBatch(gl, screen.matrix);
        }
        this.textures.push(o.def.texture);
      }

      const textureId = this.textures.indexOf(o.def.texture);
      const mode = o.def.fillMode * 8 + textureId;

      const renderMatrix = o.renderMatrix;
      const uvMatrix = o.def.uvMatrix;

      let i = this.numVertex;
      for (let j = 0; j < numVertex; j++) {
        const x = o.def.vertices[j * 2 + 0];
        const y = o.def.vertices[j * 2 + 1];

        this.vertices.data[i * 4 + 0] =
          renderMatrix[0] * x + renderMatrix[2] * y + renderMatrix[4];
        this.vertices.data[i * 4 + 1] =
          renderMatrix[1] * x + renderMatrix[3] * y + renderMatrix[5];
        this.vertices.data[i * 4 + 2] =
          uvMatrix[0] * x + uvMatrix[2] * y + uvMatrix[4];
        this.vertices.data[i * 4 + 3] =
          uvMatrix[1] * x + uvMatrix[3] * y + uvMatrix[5];
        i++;
      }
      this.colors.data.fill(o.def.tint, this.numVertex, i);
      this.modes.data.fill(mode, this.numVertex, i);
      this.numVertex = i;
    }

    this.flushBatch(gl, screen.matrix);
  }

  private flushBatch(gl: WebGL2RenderingContext, projectionMat: mat3) {
    if (this.numVertex === 0) {
      return;
    }

    this.vertices.markDirty(this.numVertex * 4);
    this.colors.markDirty(this.numVertex);
    this.modes.markDirty(this.numVertex);

    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const textures = this.textures.map((tex) => tex.ensure(gl));

    gl.useProgram(programSprite.ensure(gl));

    for (let i = 0; i < textures.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, textures[i]);
      this.texIDs[i] = i;
    }

    programSprite.setUniform(gl, "uProjectionMatrix", projectionMat);
    programSprite.setUniform(gl, "uTex", this.texIDs);
    programSprite.setAttr(gl, "aVertex", this.vertices);
    programSprite.setAttr(gl, "aColor", this.colors);
    programSprite.setAttr(gl, "aMode", this.modes);
    gl.drawArrays(gl.TRIANGLES, 0, this.numVertex);

    this.reset();
  }
}
