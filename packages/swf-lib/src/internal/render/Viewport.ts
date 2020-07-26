import { mat3 } from "gl-matrix";
import { rect } from "../math/rect";

export interface Viewport {
  bounds: rect;
  matrix: mat3;
}
