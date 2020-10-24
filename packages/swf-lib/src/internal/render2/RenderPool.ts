import { Texture } from "./gl/Texture";
import { Renderbuffer } from "./gl/Renderbuffer";
import { Framebuffer } from "./gl/Framebuffer";
import { TextureTarget, RenderbufferTarget } from "./gl/targets";
import { GLState } from "./gl/GLState";

interface CacheItem<T> {
  item: T;
  insertAt: number;
}

export class RenderPool {
  private readonly texturePool = new Map<string, CacheItem<TextureTarget>[]>();
  private readonly renderbufferPool = new Map<
    string,
    CacheItem<RenderbufferTarget>[]
  >();

  constructor(readonly state: GLState) {}

  takeTexture(width: number, height: number): TextureTarget {
    const key = `${width}:${height}`;

    const items = this.texturePool.get(key) || [];
    if (items.length === 0) {
      const texture = Texture.size(width, height);
      const framebuffer = new Framebuffer(texture);
      items.push({ insertAt: +new Date(), item: { texture, framebuffer } });
    }
    return items.pop()!.item;
  }

  takeRenderbuffer(width: number, height: number): RenderbufferTarget {
    const key = `${width}:${height}`;

    const items = this.renderbufferPool.get(key) || [];
    if (items.length === 0) {
      const rb = new Renderbuffer(width, height, "rgba");
      const framebuffer = new Framebuffer(rb);
      items.push({
        insertAt: +new Date(),
        item: { renderbuffer: rb, framebuffer },
      });
    }
    return items.pop()!.item;
  }

  returnTexture(target: TextureTarget) {
    const key = `${target.texture.width}:${target.texture.height}`;
    const items = this.texturePool.get(key) || [];
    items.push({ insertAt: +new Date(), item: target });
    this.texturePool.set(key, items);
  }

  returnRenderbuffer(target: RenderbufferTarget) {
    const key = `${target.renderbuffer.width}:${target.renderbuffer.height}`;
    const items = this.renderbufferPool.get(key) || [];
    items.push({ insertAt: +new Date(), item: target });
    this.renderbufferPool.set(key, items);
  }

  cleanLRU() {
    const threshold = +new Date() - 60 * 1000;
    for (const [key, items] of this.renderbufferPool) {
      const toBeDeleted = items.filter((item) => item.insertAt < threshold);
      for (const { item } of toBeDeleted) {
        item.renderbuffer.delete(this.state);
        item.framebuffer.delete(this.state);
      }
      this.renderbufferPool.set(
        key,
        items.filter((item) => !toBeDeleted.includes(item))
      );
    }
    for (const [key, items] of this.texturePool) {
      const toBeDeleted = items.filter((item) => item.insertAt < threshold);
      for (const { item } of toBeDeleted) {
        item.texture.delete(this.state);
        item.framebuffer.delete(this.state);
      }
      this.texturePool.set(
        key,
        items.filter((item) => !toBeDeleted.includes(item))
      );
    }
  }
}
