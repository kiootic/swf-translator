import { Viewport } from "./Viewport";
import { rect } from "../math/rect";

export interface RenderObjectProgram<T extends RenderObject> {
  render(
    gl: WebGL2RenderingContext,
    depth: number,
    viewport: Viewport,
    objects: T[]
  ): void;
}

export interface RenderObject {
  readonly program: RenderObjectProgram<this>;

  getBounds(bounds: rect): void;
}
