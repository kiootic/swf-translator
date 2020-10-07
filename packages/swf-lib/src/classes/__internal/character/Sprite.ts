import { Matrix, ColorTransform } from "./primitives";
import { Filter } from "./filter";
import { SoundInfo } from "./Sound";

export interface SpriteCharacter {
  numFrames: number;
  frames: SpriteFrame[];
}

export interface SpriteFrame {
  frame: number;
  label?: string;
  actions: FrameAction[];
}

export type FrameAction =
  | FrameActionPlaceObject
  | FrameActionRemoveObject
  | FrameActionStartSound;

export enum FrameActionKind {
  PlaceObject = 0,
  RemoveObject = 1,
  StartSound = 2,
}

export interface FrameActionPlaceObject {
  kind: FrameActionKind.PlaceObject;
  depth: number;
  version: 1 | 2 | 3;
  moveCharacter: boolean;
  characterId?: number;

  matrix?: Matrix;
  colorTransform?: ColorTransform;
  ratio?: number;
  name?: string;
  clipDepth?: number;

  filters?: Filter[];
  blendMode?: number;
  cacheAsBitmap?: boolean;
  visible?: boolean;
}

export interface FrameActionRemoveObject {
  kind: FrameActionKind.RemoveObject;
  depth: number;
}

export interface FrameActionStartSound {
  kind: FrameActionKind.StartSound;
  characterId: number;
  soundInfo: SoundInfo;
}
