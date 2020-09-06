import { mat3 } from "gl-matrix";
import { Canvas } from "./Canvas";
import { SceneNode } from "./SceneNode";
import { RenderContext, DeferredRender } from "./RenderContext";
import { rect } from "../math/rect";
import { renderVertexShader, renderFragmentShader } from "./programs/render";
import { GLState } from "./gl/GLState";
import { Texture } from "./gl/Texture";
import { Buffer } from "./gl/Buffer";
import { Program } from "./gl/Program";
import { VertexArray } from "./gl/VertexArray";

const vertexLimit = 0x10000;

export class Renderer {
  readonly glState: GLState;

  private readonly projectionMatrix: mat3;

  private readonly textureMap = new Map<unknown, Texture>();

  private readonly indices = Buffer.index(
    new Uint16Array(0x80000),
    "STREAM_DRAW"
  );
  private readonly vertices = Buffer.vertex(
    new Float32Array(vertexLimit * 4),
    "STREAM_DRAW"
  );
  private readonly colors = Buffer.vertex(
    new Uint32Array(vertexLimit * 1),
    "STREAM_DRAW"
  );
  private readonly colorMul = Buffer.vertex(
    new Float32Array(vertexLimit * 4),
    "STREAM_DRAW"
  );
  private readonly colorAdd = Buffer.vertex(
    new Float32Array(vertexLimit * 4),
    "STREAM_DRAW"
  );
  private readonly modes = Buffer.vertex(
    new Uint8Array(vertexLimit * 1),
    "STREAM_DRAW"
  );
  private readonly textureUnits: Int32Array;

  private readonly renderProgram: Program;
  private readonly renderVertexArray = new VertexArray(
    [
      { index: 0, buffer: this.vertices, type: "float", components: 4 },
      {
        index: 1,
        buffer: this.colors,
        type: "byte",
        components: 4,
        normalized: true,
      },
      { index: 2, buffer: this.colorMul, type: "float", components: 4 },
      { index: 3, buffer: this.colorAdd, type: "float", components: 4 },
      {
        index: 4,
        buffer: this.modes,
        type: "byte",
        components: 1,
        integer: true,
      },
    ],
    this.indices
  );

  backgroundColor = 0x000000;

  constructor(readonly canvas: Canvas) {
    this.glState = new GLState(canvas.element, {
      alpha: false,
      premultipliedAlpha: false,
    });

    this.projectionMatrix = mat3.projection(
      mat3.create(),
      canvas.width,
      canvas.height
    );
    this.renderProgram = new Program(
      renderVertexShader,
      renderFragmentShader(this.glState.maxTextures)
    );
    this.textureUnits = new Int32Array(this.glState.maxTextures);

    this.renderProgram.ensure(this.glState);
    this.renderVertexArray.ensure(this.glState);
  }

  renderFrame(node: SceneNode) {
    const { width, height } = this.canvas;
    const bounds = rect.fromValues(0, 0, width, height);
    const ctx = new RenderContext(bounds);
    node.render(ctx);

    const gl = this.glState.gl;

    this.glState.setClearColor(
      ((this.backgroundColor >>> 16) & 0xff) / 0xff,
      ((this.backgroundColor >>> 8) & 0xff) / 0xff,
      ((this.backgroundColor >>> 0) & 0xff) / 0xff,
      1
    );
    this.glState.enable(gl.BLEND);
    this.glState.setBlendEquation(gl.FUNC_ADD);
    this.glState.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.clear(gl.COLOR_BUFFER_BIT);
    this.render(ctx.renders);
  }

  private loadTexture(image: HTMLImageElement | HTMLCanvasElement | null) {
    let tex = this.textureMap.get(image);
    if (!tex) {
      tex = image ? Texture.image(image) : Texture.WHITE;
      this.textureMap.set(image, tex);
    }
    return tex;
  }

  private render(renders: DeferredRender[]) {
    const gl = this.glState.gl;

    let numVertex = 0;
    let numIndex = 0;
    const textures: Texture[] = [];
    const flush = () => {
      if (numIndex === 0) {
        return;
      }

      this.indices.update(this.glState, 0, numIndex);
      this.vertices.update(this.glState, 0, numVertex * 4);
      this.colors.update(this.glState, 0, numVertex);
      this.colorMul.update(this.glState, 0, numVertex * 4);
      this.colorAdd.update(this.glState, 0, numVertex * 4);
      this.modes.update(this.glState, 0, numVertex);

      for (const tex of textures) {
        tex.ensure(this.glState);
      }
      this.textureUnits.fill(0);
      this.textureUnits.set(
        this.glState.bindTextures(textures.map((tex) => tex.texture))
      );
      this.renderProgram.uniform(
        this.glState,
        "uTextures[0]",
        this.textureUnits
      );
      this.renderProgram.uniform(
        this.glState,
        "uProjectionMatrix",
        this.projectionMatrix
      );
      this.glState.useProgram(this.renderProgram.program);
      this.glState.bindVertexArray(this.renderVertexArray.vertexArray);
      gl.drawElements(gl.TRIANGLES, numIndex, gl.UNSIGNED_SHORT, 0);

      numVertex = 0;
      numIndex = 0;
      textures.length = 0;
    };

    for (const render of renders) {
      const objectNumVertex = render.object.vertices.length / 2;
      const objectNumIndex = render.object.indices.length;
      if (numVertex + objectNumVertex >= vertexLimit) {
        flush();
      } else if (numIndex + objectNumIndex >= this.indices.length) {
        flush();
      }

      const texture = this.loadTexture(render.object.texture);
      let textureIndex = textures.indexOf(texture);
      if (textureIndex === -1) {
        if (textures.length > this.glState.maxTextures) {
          flush();
        }
        textureIndex = textures.push(texture) - 1;
      }

      for (let i = 0; i < objectNumIndex; i++) {
        this.indices.data[numIndex + i] = render.object.indices[i] + numVertex;
      }

      const transform = render.transform;
      const uv = render.object.uvMatrix;
      for (let i = 0; i < objectNumVertex; i++) {
        const x = render.object.vertices[i * 2];
        const y = render.object.vertices[i * 2 + 1];
        this.vertices.data[(numVertex + i) * 4 + 0] =
          transform[0] * x + transform[2] * y + transform[4];
        this.vertices.data[(numVertex + i) * 4 + 1] =
          transform[1] * x + transform[3] * y + transform[5];
        this.vertices.data[(numVertex + i) * 4 + 2] =
          uv[0] * x + uv[2] * y + uv[4];
        this.vertices.data[(numVertex + i) * 4 + 3] =
          uv[1] * x + uv[3] * y + uv[5];

        this.colorMul.data[(numVertex + i) * 4 + 0] = render.colorMul[0];
        this.colorMul.data[(numVertex + i) * 4 + 1] = render.colorMul[1];
        this.colorMul.data[(numVertex + i) * 4 + 2] = render.colorMul[2];
        this.colorMul.data[(numVertex + i) * 4 + 3] = render.colorMul[3];

        this.colorAdd.data[(numVertex + i) * 4 + 0] = render.colorAdd[0] / 0xff;
        this.colorAdd.data[(numVertex + i) * 4 + 1] = render.colorAdd[1] / 0xff;
        this.colorAdd.data[(numVertex + i) * 4 + 2] = render.colorAdd[2] / 0xff;
        this.colorAdd.data[(numVertex + i) * 4 + 3] = render.colorAdd[3] / 0xff;
      }

      this.colors.data.set(render.object.colors, numVertex);

      const mode = render.object.fillMode + textureIndex * 4;
      this.modes.data.fill(mode, numVertex, numVertex + objectNumVertex);

      numVertex += objectNumVertex;
      numIndex += objectNumIndex;
    }
    flush();
  }
}
