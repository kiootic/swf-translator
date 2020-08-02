import type { Renderer } from "./Renderer";
import { RenderObject } from "./RenderObject";
import { rect } from "../math/rect";

export class RenderLayer {
  stencilDepth = 0;
  stencil?: RenderLayer;
  readonly children: (RenderObject | RenderLayer)[] = [];
  readonly bounds = rect.create();
}

const tmpBounds = rect.create();

export class RenderContext {
  readonly root = new RenderLayer();
  currentLayer = this.root;

  constructor(readonly renderer: Renderer, readonly bounds: rect) {}

  get gl() {
    return this.renderer.gl;
  }

  // TODO: use correct stencil algorithm
  stencil(stencil: () => void): () => void {
    const parentLayer = this.currentLayer;

    const stencilLayer = new RenderLayer();
    stencilLayer.stencilDepth = parentLayer.stencilDepth;
    this.currentLayer = stencilLayer;
    stencil();

    const layer = new RenderLayer();
    layer.stencilDepth = parentLayer.stencilDepth + 1;
    layer.stencil = stencilLayer;
    this.currentLayer = layer;
    parentLayer.children.push(layer);

    return () => (this.currentLayer = parentLayer);
  }

  render(obj: RenderObject) {
    this.currentLayer.children.push(obj);
    obj.getBounds(tmpBounds);
    rect.union(this.currentLayer.bounds, this.currentLayer.bounds, tmpBounds);
  }
}
