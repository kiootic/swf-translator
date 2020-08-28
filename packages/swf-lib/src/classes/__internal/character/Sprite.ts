import { Matrix, ColorTransform } from "./primitives";
import { Filter } from "./filter";

export interface SpriteCharacter {
  numFrames: number;
  frames: SpriteFrame[];
}

export interface SpriteFrame {
  frame: number;
  label?: string;
  actions: FrameAction[];
}

export type FrameAction = FrameActionPlaceObject | FrameActionRemoveObject;

export enum FrameActionKind {
  PlaceObject = 0,
  RemoveObject = 1,
}

export interface FrameActionPlaceObject {
  kind: FrameActionKind.PlaceObject;
  depth: number;
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
