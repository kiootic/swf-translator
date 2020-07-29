import type { Renderer } from "./Renderer";
import { RenderObject } from "./RenderObject";

interface RenderLayerStencil {
  depth: number;
  layer: RenderLayer;
}

export class RenderLayer {
  stencil?: RenderLayerStencil;
  readonly children: (RenderObject | RenderLayer)[] = [];
}

export class RenderContext {
  readonly root = new RenderLayer();
  currentLayer = this.root;
  depth = 0;
  readonly stencils: RenderLayerStencil[] = [];

  constructor(readonly renderer: Renderer) {}

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
  }

  finalize() {}
}
