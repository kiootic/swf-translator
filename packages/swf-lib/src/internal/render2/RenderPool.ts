import { Texture } from "./gl/Texture";
import { Renderbuffer } from "./gl/Renderbuffer";
import { Framebuffer } from "./gl/Framebuffer";
import { TextureTarget, RenderbufferTarget } from "./gl/targets";

export class RenderPool {
  private readonly texturePool = new Map<string, TextureTarget[]>();
  private readonly renderbufferPool = new Map<string, RenderbufferTarget[]>();

  takeTexture(width: number, height: number): TextureTarget {
    const key = `${width}:${height}`;

    const items = this.texturePool.get(key) || [];
    if (items.length === 0) {
      const texture = Texture.size(width, height);
      const framebuffer = new Framebuffer(texture);
      items.push({ texture, framebuffer });
    }
    return items.pop()!;
  }

  takeRenderbuffer(width: number, height: number): RenderbufferTarget {
    const key = `${width}:${height}`;

    const items = this.renderbufferPool.get(key) || [];
    if (items.length === 0) {
      const rb = new Renderbuffer(width, height, "rgba");
      const framebuffer = new Framebuffer(rb);
      items.push({ renderbuffer: rb, framebuffer });
    }
    return items.pop()!;
  }

  returnTexture(target: TextureTarget) {
    const key = `${target.texture.width}:${target.texture.height}`;
    const items = this.texturePool.get(key) || [];
    items.push(target);
    this.texturePool.set(key, items);
  }

  returnRenderbuffer(target: RenderbufferTarget) {
    const key = `${target.renderbuffer.width}:${target.renderbuffer.height}`;
    const items = this.renderbufferPool.get(key) || [];
    items.push(target);
    this.renderbufferPool.set(key, items);
  }
}
