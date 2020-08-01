import { Matrix, Rect } from "./primitives";
import { ShapeCharacter } from "./Shape";

export interface MorphShapeCharacter {
  frames: [number, ShapeCharacter][];
}
