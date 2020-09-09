import { Filter, FilterInput, FilterInstance } from "./Filter";
import { TextureTarget } from "../gl/targets";

export interface BlurFilterInstance extends FilterInstance {
  blurX: number;
  blurY: number;
  passes: number;
}

export class BlurFilter implements Filter<BlurFilterInstance> {
  static readonly instance = new BlurFilter();

  apply(input: FilterInput<BlurFilterInstance>[], out: TextureTarget): void {
    // TODO: implement it
  }
}
