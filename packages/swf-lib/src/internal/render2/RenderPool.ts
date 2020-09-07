import { Texture } from "./gl/Texture";
import { Renderbuffer } from "./gl/Renderbuffer";
import { Framebuffer } from "./gl/Framebuffer";

function texSize(n: number) {
  if (n < 128) {
    return 128;
  } else if (n < 256) {
    return 256;
  } else if (n < 512) {
    return 512;
  } else {
    return n;
  }
}

export interface TexturePoolItem {
  texture: Texture;
  framebuffer: Framebuffer;
}

export interface RenderbufferPoolItem {
  renderbuffer: Renderbuffer;
  framebuffer: Framebuffer;
}

export class RenderPool {
  private readonly texturePool = new Map<string, TexturePoolItem[]>();
  private readonly renderbufferPool = new Map<string, RenderbufferPoolItem[]>();

  takeTexture(width: number, height: number): TexturePoolItem {
    width = texSize(width);
    height = texSize(height);
    const key = `${width}:${height}`;

    const items = this.texturePool.get(key) || [];
    if (items.length === 0) {
      const texture = Texture.size(width, height);
      const framebuffer = new Framebuffer(texture);
      items.push({ texture, framebuffer });
    }
    return items.pop()!;
  }

  takeRenderbuffer(width: number, height: number): RenderbufferPoolItem {
    width = texSize(width);
    height = texSize(height);
    const key = `${width}:${height}`;

    const items = this.renderbufferPool.get(key) || [];
    if (items.length === 0) {
      const rb = new Renderbuffer(width, height, "color");
      const framebuffer = new Framebuffer(rb);
      items.push({ renderbuffer: rb, framebuffer });
    }
    return items.pop()!;
  }

  returnTexture(poolItem: TexturePoolItem) {
    const key = `${poolItem.texture.width}:${poolItem.texture.height}`;
    const items = this.texturePool.get(key) || [];
    items.push(poolItem);
    this.texturePool.set(key, items);
  }

  returnRenderbuffer(poolItem: RenderbufferPoolItem) {
    const key = `${poolItem.renderbuffer.width}:${poolItem.renderbuffer.height}`;
    const items = this.renderbufferPool.get(key) || [];
    items.push(poolItem);
    this.renderbufferPool.set(key, items);
  }
}
