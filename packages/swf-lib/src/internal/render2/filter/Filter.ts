import { Texture } from "../gl/Texture";
import { rect } from "../../math/rect";
import { TextureTarget } from "../gl/targets";

export interface FilterInstance {
  filter: Filter<this>;
  padX: number;
  padY: number;
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
