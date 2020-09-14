import { mat2d } from "gl-matrix";
import { Canvas } from "./Canvas";
import { SceneNode } from "./SceneNode";
import {
  RenderContext,
  DeferredRender,
  DeferredRenderObject,
  DeferredRenderTexture,
  DeferredRenderFilter,
  DeferredRenderCache,
} from "./RenderContext";
import { rect } from "../math/rect";
import { renderVertexShader, renderFragmentShader } from "./programs/render";
import { GLState } from "./gl/GLState";
import { Texture } from "./gl/Texture";
import { Buffer } from "./gl/Buffer";
import { Program } from "./gl/Program";
import { VertexArray } from "./gl/VertexArray";
import { RenderPool } from "./RenderPool";
import { Framebuffer } from "./gl/Framebuffer";
import { Renderbuffer } from "./gl/Renderbuffer";
import { TextureTarget, RenderbufferTarget } from "./gl/targets";
import { Atlas } from "./Atlas";
import { FilterInput, Filter, FilterInstance } from "./filter/Filter";
import { projection } from "../math/matrix";
import { CachedRender } from "./CachedRender";

const vertexLimit = 0x10000;
const indexLimit = 0x80000;
const atlasSize = 1024;

function renderTextureSize(n: number) {
  if (n < 128) {
    return 128;
  } else if (n < 256) {
    return 256;
  } else if (n < 512) {
    return 512;
  } else if (n < 1024) {
    return 1024;
  } else {
    return Math.ceil(n);
  }
}

export class Renderer {
  readonly glState: GLState;

  private readonly textureMap = new Map<unknown, Texture>();
  readonly renderPool = new RenderPool();
  readonly textureReturnBox: TextureTarget[] = [];
  readonly renderbufferReturnBox: RenderbufferTarget[] = [];

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

  private readonly defaultFramebuffer: Framebuffer;

  backgroundColor = 0x000000;

  constructor(readonly canvas: Canvas) {
    this.glState = new GLState(canvas.element, {
      alpha: false,
      premultipliedAlpha: false,
      antialias: false,
    });

    this.renderProgram = new Program(
      renderVertexShader,
      renderFragmentShader(this.glState.maxTextures)
    );
    this.textureUnits = new Int32Array(this.glState.maxTextures);

    this.renderProgram.ensure(this.glState);
    this.renderVertexArray.ensure(this.glState);

    this.defaultFramebuffer = new Framebuffer(
      new Renderbuffer(canvas.width, canvas.height, "rgb")
    );
  }

  renderFrame(node: SceneNode) {
    const { width, height } = this.canvas;
    const bounds = rect.fromValues(0, 0, width, height);
    const ctx = new RenderContext(bounds);
    node.render(ctx);
    ctx.applyProjection(projection(mat2d.create(), width, height, true));

    const gl = this.glState.gl;
    this.textureReturnBox.length = 0;
    this.renderbufferReturnBox.length = 0;
    try {
      this.render(ctx.renders, this.defaultFramebuffer);
    } finally {
      for (const texture of this.textureReturnBox) {
        this.renderPool.returnTexture(texture);
      }
      for (const renderbuffer of this.renderbufferReturnBox) {
        this.renderPool.returnRenderbuffer(renderbuffer);
      }
      this.renderPool.cleanLRU();
    }

    this.defaultFramebuffer.ensure(this.glState);
    this.glState.bindFramebuffer(
      gl.READ_FRAMEBUFFER,
      this.defaultFramebuffer.framebuffer
    );
    this.glState.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
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

  private render(renders: DeferredRender[], framebuffer: Framebuffer) {
    const textures: DeferredRenderTexture[] = [];
    const filters: DeferredRenderFilter[] = [];
    const caches: DeferredRenderCache[] = [];
    const classifyRenders = (renders: DeferredRender[]) => {
      textures.length = 0;
      filters.length = 0;
      caches.length = 0;
      for (const render of renders) {
        if ("texture" in render) {
          textures.push(render);
        } else if ("filter" in render) {
          filters.push(render);
        } else if ("cache" in render) {
          caches.push(render);
        }
      }
    };

    let resolved: boolean;
    classifyRenders(renders);
    do {
      resolved = false;

      while (caches.length > 0) {
        this.renderCaches(renders, caches);
        resolved = true;
        classifyRenders(renders);
      }
      while (textures.length > 0) {
        this.renderTextures(renders, textures);
        resolved = true;
        classifyRenders(renders);
      }
      while (filters.length > 0) {
        this.renderFilters(renders, filters);
        resolved = true;
        classifyRenders(renders);
      }
    } while (resolved);
    this.renderObjects(renders as DeferredRenderObject[], framebuffer);
  }

  private renderTextures(
    renders: DeferredRender[],
    textures: DeferredRenderTexture[]
  ) {
    const gl = this.glState.gl;
    let atlas: Atlas | null = null;
    let atlasContext: RenderContext | null = null;
    const atlasItems = new Map<DeferredRenderTexture, rect>();

    const flush = () => {
      if (!atlas || !atlasContext || atlasItems.size === 0) {
        return;
      }
      const projectionMat = projection(
        mat2d.create(),
        atlas.width,
        atlas.height,
        false
      );
      atlasContext.applyProjection(projectionMat);

      const texItem = this.renderPool.takeTexture(atlas.width, atlas.height);
      const rbItem = this.renderPool.takeRenderbuffer(
        atlas.width,
        atlas.height
      );
      this.textureReturnBox.push(texItem);
      this.renderbufferReturnBox.push(rbItem);

      this.render(atlasContext.renders, rbItem.framebuffer);

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
        atlas.width,
        atlas.height,
        0,
        0,
        atlas.width,
        atlas.height,
        gl.COLOR_BUFFER_BIT,
        gl.NEAREST
      );

      for (const [item, bounds] of atlasItems) {
        const ctx = new RenderContext(null);
        ctx.transform = item.transform;
        item.texture.then(ctx, texItem.texture, bounds);

        const index = renders.indexOf(item);
        renders.splice(index, 1, ...ctx.renders);
      }
    };

    for (const render of textures) {
      const { bounds, paddings, scale, translate, fn } = render.texture;

      const ctx = new RenderContext(null);
      const renderView = mat2d.fromTranslation(mat2d.create(), [
        paddings[0] + translate[0] - Math.floor(translate[0]),
        paddings[1] + translate[1] - Math.floor(translate[1]),
      ]);
      mat2d.scale(renderView, renderView, scale);
      mat2d.translate(renderView, renderView, [-bounds[0], -bounds[1]]);

      ctx.pushTransform(renderView);
      fn(ctx);
      ctx.popTransform();

      const renderBounds = ctx.bounds;
      // Left padding in renderBounds[0], add right paddings manually.
      const width = Math.ceil(
        Math.abs(renderBounds[0]) + renderBounds[2] + paddings[0]
      );
      const height = Math.ceil(
        Math.abs(renderBounds[1]) + renderBounds[3] + paddings[1]
      );

      let atlasBounds: rect | null;
      if (
        !atlas ||
        !atlasContext ||
        !(atlasBounds = atlas.add(width, height))
      ) {
        flush();

        atlas = new Atlas(
          Math.max(atlasSize, renderTextureSize(width)),
          Math.max(atlasSize, renderTextureSize(height))
        );
        atlasContext = new RenderContext(null);
        atlasItems.clear();
        atlasBounds = atlas.add(width, height)!;
      }

      mat2d.fromTranslation(renderView, [atlasBounds[0], atlasBounds[1]]);
      atlasContext.pushTransform(renderView);
      atlasContext.renderContext(ctx);
      atlasContext.popTransform();

      atlasItems.set(render, atlasBounds);
    }
    flush();
  }

  private renderCaches(
    renders: DeferredRender[],
    caches: DeferredRenderCache[]
  ) {
    const gl = this.glState.gl;
    for (const render of caches) {
      const { texture, bounds, view, then } = render.cache;

      const width = renderTextureSize(bounds[2]);
      const height = renderTextureSize(bounds[3]);
      const cacheTexture = this.renderPool.takeTexture(width, height);

      const tmpFramebuffer = new Framebuffer(texture);
      try {
        tmpFramebuffer.ensure(this.glState);
        cacheTexture.framebuffer.ensure(this.glState);

        this.glState.bindFramebuffer(
          gl.READ_FRAMEBUFFER,
          tmpFramebuffer.framebuffer
        );
        this.glState.bindFramebuffer(
          gl.DRAW_FRAMEBUFFER,
          cacheTexture.framebuffer.framebuffer
        );
        gl.blitFramebuffer(
          bounds[0],
          bounds[1],
          bounds[0] + bounds[2],
          bounds[1] + bounds[3],
          0,
          0,
          bounds[2],
          bounds[3],
          gl.COLOR_BUFFER_BIT,
          gl.NEAREST
        );
      } finally {
        tmpFramebuffer.delete();
      }

      then(
        new CachedRender(
          this.renderPool,
          cacheTexture,
          view,
          rect.fromValues(0, 0, bounds[2], bounds[3])
        )
      );

      const index = renders.indexOf(render);
      renders.splice(index, 1);
    }
  }

  private renderFilters(
    renders: DeferredRender[],
    filters: DeferredRenderFilter[]
  ) {
    const gl = this.glState.gl;
    let atlas: Atlas | null = null;
    let filter: Filter | null = null;
    const filterInputs = new Map<DeferredRenderFilter, FilterInput>();

    const flush = () => {
      if (!atlas || !filter || filterInputs.size === 0) {
        return;
      }
      const target = this.renderPool.takeTexture(atlas.width, atlas.height);
      this.textureReturnBox.push(target);

      filter.apply(this, Array.from(filterInputs.values()), target);

      for (const [render, { outBounds }] of filterInputs) {
        const ctx = new RenderContext(null);
        ctx.transform = render.transform;
        render.filter.then(ctx, target.texture, outBounds);

        const index = renders.indexOf(render);
        renders.splice(index, 1, ...ctx.renders);
      }

      atlas = null;
      filterInputs.clear();
    };

    const filterGroups = new Map<Filter, DeferredRenderFilter[]>();
    for (const render of filters) {
      const filter = render.filter.instance.filter;
      let group = filterGroups.get(filter);
      if (!group) {
        group = [];
        filterGroups.set(filter, group);
      }
      group.push(render);
    }

    for (const [groupFilter, renders] of filterGroups) {
      filter = groupFilter;
      for (const render of renders) {
        const { texture, bounds, instance } = render.filter;
        let atlasBounds: rect | null;
        if (!atlas || !(atlasBounds = atlas.add(bounds[2], bounds[3]))) {
          flush();

          atlas = new Atlas(
            Math.max(atlasSize, renderTextureSize(bounds[2])),
            Math.max(atlasSize, renderTextureSize(bounds[3]))
          );
          atlasBounds = atlas.add(bounds[2], bounds[3])!;
        }

        const input: FilterInput = {
          instance,
          texture,
          inBounds: bounds,
          outBounds: atlasBounds,
        };
        filterInputs.set(render, input);
      }
      flush();
    }
  }

  private renderObjects(
    objects: DeferredRenderObject[],
    framebuffer: Framebuffer
  ) {
    const gl = this.glState.gl;
    framebuffer.ensure(this.glState);
    this.glState.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.framebuffer);

    this.glState.setViewport(
      0,
      0,
      framebuffer.colorAttachment.width,
      framebuffer.colorAttachment.height
    );

    this.glState.enable(gl.BLEND);
    this.glState.setBlendEquation(gl.FUNC_ADD);
    this.glState.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    if (framebuffer !== this.defaultFramebuffer) {
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
      this.renderVertexArray.bind(this.glState);
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
