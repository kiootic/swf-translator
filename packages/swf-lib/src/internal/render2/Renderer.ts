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
const indexLimit = 0x80000;

export class Renderer {
  readonly glState: GLState;

  private readonly textureMap = new Map<unknown, Texture>();

  private readonly indexData = new Uint16Array(indexLimit);
  private readonly attributeData = new ArrayBuffer(vertexLimit * 14 * 4);
  private readonly textureUnits: Int32Array;

  private readonly indices = Buffer.index(this.indexData, "STREAM_DRAW");
  private readonly attributes = Buffer.vertex(
    new Uint32Array(this.attributeData),
    "STREAM_DRAW"
  );
  private readonly attrFloat = new Float32Array(this.attributeData, 0);
  private readonly attrUint = new Uint32Array(this.attributeData, 0);

  private readonly renderProgram: Program;
  private readonly renderVertexArray = new VertexArray(
    [
      {
        index: 0,
        buffer: this.attributes,
        type: "float",
        components: 4,
        offset: 0,
        stride: 56,
      },
      {
        index: 1,
        buffer: this.attributes,
        type: "byte",
        components: 4,
        normalized: true,
        offset: 16,
        stride: 56,
      },
      {
        index: 2,
        buffer: this.attributes,
        type: "float",
        components: 4,
        offset: 20,
        stride: 56,
      },
      {
        index: 3,
        buffer: this.attributes,
        type: "float",
        components: 4,
        offset: 36,
        stride: 56,
      },
      {
        index: 4,
        buffer: this.attributes,
        type: "uint",
        components: 1,
        integer: true,
        offset: 52,
        stride: 56,
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
      this.attributes.update(this.glState, 0, numVertex * 14);

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
      } else if (numIndex + objectNumIndex >= indexLimit) {
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

      const { view, colorMul, colorAdd } = render.transform;
      const uv = render.object.uvMatrix;
      const mode = render.object.fillMode + textureIndex * 4;
      for (let i = 0; i < objectNumVertex; i++) {
        const x = render.object.vertices[i * 2];
        const y = render.object.vertices[i * 2 + 1];
        const color = render.object.colors[i];

        this.attrFloat[(numVertex + i) * 14 + 0] =
          view[0] * x + view[2] * y + view[4];
        this.attrFloat[(numVertex + i) * 14 + 1] =
          view[1] * x + view[3] * y + view[5];

        this.attrFloat[(numVertex + i) * 14 + 2] =
          uv[0] * x + uv[2] * y + uv[4];
        this.attrFloat[(numVertex + i) * 14 + 3] =
          uv[1] * x + uv[3] * y + uv[5];

        this.attrUint[(numVertex + i) * 14 + 4] = color;

        this.attrFloat[(numVertex + i) * 14 + 5] = colorMul[0];
        this.attrFloat[(numVertex + i) * 14 + 6] = colorMul[1];
        this.attrFloat[(numVertex + i) * 14 + 7] = colorMul[2];
        this.attrFloat[(numVertex + i) * 14 + 8] = colorMul[3];

        this.attrFloat[(numVertex + i) * 14 + 9] = colorAdd[0];
        this.attrFloat[(numVertex + i) * 14 + 10] = colorAdd[1];
        this.attrFloat[(numVertex + i) * 14 + 11] = colorAdd[2];
        this.attrFloat[(numVertex + i) * 14 + 12] = colorAdd[3];

        this.attrUint[(numVertex + i) * 14 + 13] = mode;
      }

      numVertex += objectNumVertex;
      numIndex += objectNumIndex;
    }
    flush();
  }
}
