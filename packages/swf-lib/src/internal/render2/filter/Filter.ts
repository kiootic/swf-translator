import { Texture } from "../gl/Texture";
import { rect } from "../../math/rect";
import { TextureTarget } from "../gl/targets";
import { vec2 } from "gl-matrix";

export interface FilterInstance {
  filter: Filter<this>;
  paddings: vec2;
}

export interface FilterInput<T extends FilterInstance> {
  instance: T;
  texture: Texture;
  inBounds: rect;
  outBounds: rect;
}

export interface Filter<T extends FilterInstance> {
  apply(input: FilterInput<T>[], out: TextureTarget): void;
}
