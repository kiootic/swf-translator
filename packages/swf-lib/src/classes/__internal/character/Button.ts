import { Matrix, ColorTransform } from "./primitives";
import { Filter } from "./filter";
import { SoundInfo } from "./Sound";

export interface ButtonCharacter {
  trackAsMenu: boolean;
  characters: ButtonRecord[];

  overUpToIdle?: ButtonSound;
  idleToOverUp?: ButtonSound;
  overUpToOverDown?: ButtonSound;
  overDownToOverUp?: ButtonSound;
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

export interface ButtonSound {
  characterId: number;
  soundInfo: SoundInfo;
}
