import { Canvas } from "./Canvas";
import { SceneNode } from "./SceneNode";
import {
  RenderContext,
  DeferredRender,
  DeferredRenderObject,
  DeferredRenderTexture,
} from "./RenderContext";
import { rect } from "../math/rect";
import { renderVertexShader, renderFragmentShader } from "./programs/render";
import { GLState } from "./gl/GLState";
import { Texture } from "./gl/Texture";
import { Buffer } from "./gl/Buffer";
import { Program } from "./gl/Program";
import { VertexArray } from "./gl/VertexArray";
import {
  RenderPool,
  TexturePoolItem,
  RenderbufferPoolItem,
} from "./RenderPool";
import { RenderObject } from "./RenderObject";
import { Framebuffer } from "./gl/Framebuffer";

const vertexLimit = 0x10000;
const indexLimit = 0x80000;

export class Renderer {
  readonly glState: GLState;

  private readonly textureMap = new Map<unknown, Texture>();
  private readonly renderPool = new RenderPool();
  private readonly textureReturnBox: TexturePoolItem[] = [];
  private readonly renderbufferReturnBox: RenderbufferPoolItem[] = [];

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

    this.textureReturnBox.length = 0;
    this.renderbufferReturnBox.length = 0;
    try {
      this.render(ctx.renders, null);
    } finally {
      for (const texture of this.textureReturnBox) {
        this.renderPool.returnTexture(texture);
      }
      for (const renderbuffer of this.renderbufferReturnBox) {
        this.renderPool.returnRenderbuffer(renderbuffer);
      }
    }
  }

  private loadTexture(
    image: HTMLImageElement | HTMLCanvasElement | Texture | null
  ) {
    if (image instanceof Texture) {
      return image;
    }

    let tex = this.textureMap.get(image);
    if (!tex) {
      tex = image ? Texture.image(image) : Texture.WHITE;
      this.textureMap.set(image, tex);
    }
    return tex;
  }

  private render(renders: DeferredRender[], framebuffer: Framebuffer | null) {
    const textures: DeferredRenderTexture[] = [];
    const classifyRenders = (renders: DeferredRender[]) => {
      textures.length = 0;
      for (const render of renders) {
        if ("texture" in render) {
          textures.push(render);
        }
      }
    };

    let resolved: boolean;
    do {
      resolved = false;
      classifyRenders(renders);

      if (textures.length > 0) {
        this.renderTextures(renders, textures);
        resolved = true;
      }
    } while (resolved);
    this.renderObjects(renders as DeferredRenderObject[], framebuffer);
  }

  private renderTextures(
    renders: DeferredRender[],
    textures: DeferredRenderTexture[]
  ) {
    const gl = this.glState.gl;
    for (const render of textures) {
      const { bounds, fn, then } = render.texture;
      const width = Math.ceil(bounds[2]);
      const height = Math.ceil(bounds[3]);

      const texItem = this.renderPool.takeTexture(width, height);
      this.textureReturnBox.push(texItem);

      const rbItem = this.renderPool.takeRenderbuffer(width, height);
      try {
        const renderBounds = rect.create();
        renderBounds[0] = Math.floor(bounds[0]);
        renderBounds[1] = Math.floor(bounds[1]);
        renderBounds[2] = texItem.texture.width;
        renderBounds[3] = texItem.texture.height;
        const ctx = new RenderContext(renderBounds, true, false);
        fn(ctx);

        this.render(ctx.renders, rbItem.framebuffer);

        texItem.framebuffer.ensure(this.glState);
        this.glState.bindFramebuffer(
          gl.READ_FRAMEBUFFER,
          rbItem.framebuffer.framebuffer
        );
        this.glState.bindFramebuffer(
          gl.DRAW_FRAMEBUFFER,
          texItem.framebuffer.framebuffer
        );
        gl.blitFramebuffer(
          0,
          0,
          width,
          height,
          0,
          0,
          width,
          height,
          gl.COLOR_BUFFER_BIT,
          gl.NEAREST
        );

        renderBounds[0] = 0;
        renderBounds[1] = 0;
        renderBounds[2] = bounds[2];
        renderBounds[3] = bounds[3];
        const thenCtx = new RenderContext(renderBounds, false);
        thenCtx.transform = render.transform;
        then(thenCtx, RenderObject.rect(renderBounds, texItem.texture));

        const index = renders.indexOf(render);
        renders.splice(index, 1, ...thenCtx.renders);
      } finally {
        this.renderPool.returnRenderbuffer(rbItem);
      }
    }
  }

  private renderObjects(
    objects: DeferredRenderObject[],
    framebuffer: Framebuffer | null
  ) {
    const gl = this.glState.gl;
    framebuffer?.ensure(this.glState);
    this.glState.bindFramebuffer(
      gl.DRAW_FRAMEBUFFER,
      framebuffer?.framebuffer ?? null
    );

    if (framebuffer) {
      gl.viewport(
        0,
        0,
        framebuffer.colorAttachment.width,
        framebuffer.colorAttachment.height
      );
    } else {
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    this.glState.enable(gl.BLEND);
    this.glState.setBlendEquation(gl.FUNC_ADD);
    this.glState.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    if (framebuffer) {
      this.glState.setClearColor(0, 0, 0, 0);
    } else {
      this.glState.setClearColor(
        ((this.backgroundColor >>> 16) & 0xff) / 0xff,
        ((this.backgroundColor >>> 8) & 0xff) / 0xff,
        ((this.backgroundColor >>> 0) & 0xff) / 0xff,
        1
      );
    }
    gl.clear(gl.COLOR_BUFFER_BIT);

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

    for (const render of objects) {
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
