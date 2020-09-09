import { Filter, FilterInput, FilterInstance } from "./Filter";
import { TextureTarget } from "../gl/targets";

export interface DropShadowFilterInstance extends FilterInstance {
  blurX: number;
  blurY: number;
  passes: number;
  color: number;
  strength: number;
  angle: number;
  distance: number;
  knockout: boolean;
}

export class DropShadowFilter implements Filter<DropShadowFilterInstance> {
  static readonly instance = new DropShadowFilter();

  apply(
    input: FilterInput<DropShadowFilterInstance>[],
    out: TextureTarget
  ): void {
    // TODO: implement it
  }
}
