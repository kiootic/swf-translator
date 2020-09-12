import { vec2 } from "gl-matrix";
import { rect } from "../../math/rect";
import { Texture } from "../gl/Texture";
import { TextureTarget } from "../gl/targets";
import { Renderer } from "../Renderer";

export interface FilterInstance {
  filter: Filter<this>;
  paddings: vec2;
}

export interface FilterInput<T extends FilterInstance = FilterInstance> {
  instance: T;
  texture: Texture;
  inBounds: rect;
  outBounds: rect;
}

export interface Filter<T extends FilterInstance = FilterInstance> {
  isEffective(instance: T): boolean;
  apply(renderer: Renderer, input: FilterInput<T>[], out: TextureTarget): void;
}
