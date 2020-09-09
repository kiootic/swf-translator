import { Texture } from "./Texture";
import { Framebuffer } from "./Framebuffer";
import { Renderbuffer } from "./Renderbuffer";

export interface TextureTarget {
  texture: Texture;
  framebuffer: Framebuffer;
}

export interface RenderbufferTarget {
  renderbuffer: Renderbuffer;
  framebuffer: Framebuffer;
}
