import { Matrix, ColorTransform } from "./primitives";
import { Filter } from "./filter";

export interface Sprite {
  numFrames: number;
  frames: SpriteFrame[];
}

export interface SpriteFrame {
  frame: number;
  actions: FrameAction[];
}

export type FrameAction =
  | FrameActionPlaceObject
  | FrameActionUpdateObject
  | FrameActionRemoveObject;

export enum FrameActionKind {
  PlaceObject = 0,
  UpdateObject = 1,
  RemoveObject = 2,
}

export interface FrameActionPlaceObject {
  kind: FrameActionKind.PlaceObject;
  characterId: number;
  depth: number;
}

export interface FrameActionUpdateObject {
  kind: FrameActionKind.UpdateObject;
  depth: number;

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
