import { Matrix, ColorTransform } from "./primitives";
import { Filter } from "./filter";

export interface Button {
  trackAsMenu: boolean;
  characters: ButtonRecord[];
}

export interface ButtonRecord {
  hitTest: boolean;
  down: boolean;
  over: boolean;
  up: boolean;
  characterId: number;
  depth: number;
  matrix: Matrix;
  colorTransform?: ColorTransform;
  filters?: Filter[];
  blendMode?: number;
}
