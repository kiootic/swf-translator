import type { Renderer } from "./Renderer";
import { RenderObject } from "./RenderObject";
import { rect } from "../math/rect";

interface RenderLayerStencil {
  depth: number;
  layer: RenderLayer;
}

export class RenderLayer {
  stencil?: RenderLayerStencil;
  readonly children: (RenderObject | RenderLayer)[] = [];
  readonly bounds = rect.create();
}

const tmpBounds = rect.create();

export class RenderContext {
  readonly root = new RenderLayer();
  currentLayer = this.root;
  depth = 0;
  readonly stencils: RenderLayerStencil[] = [];

  constructor(readonly renderer: Renderer, readonly bounds: rect) {}

  get gl() {
    return this.renderer.gl;
  }

  stencil(stencil: () => void): () => void {
    const parentLayer = this.currentLayer;

    const stencilLayer = new RenderLayer();
    this.currentLayer = stencilLayer;
    stencil();

    const layer = new RenderLayer();
    layer.stencil = { depth: ++this.depth, layer: stencilLayer };
    this.stencils.push(layer.stencil);
    this.currentLayer = layer;
    parentLayer.children.push(layer);

    return () => (this.currentLayer = parentLayer);
  }

  render(obj: RenderObject) {
    this.currentLayer.children.push(obj);
    obj.getBounds(tmpBounds);
    rect.union(this.currentLayer.bounds, this.currentLayer.bounds, tmpBounds);
  }

  finalize() {
    for (const s of this.stencils) {
      s.depth = (this.depth - s.depth) / this.depth;
    }
  }
}
