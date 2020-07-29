import { Viewport } from "./Viewport";

export interface RenderObjectProgram<T extends RenderObject> {
  render(
    gl: WebGL2RenderingContext,
    viewport: Viewport,
    depth: number,
    objects: T[]
  ): void;
}

export interface RenderObject {
  readonly program: RenderObjectProgram<this>;
}
