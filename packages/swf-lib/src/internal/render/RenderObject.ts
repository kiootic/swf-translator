import { Viewport } from "./Viewport";

export interface RenderObjectProgram<T extends RenderObject> {
  render(
    gl: WebGL2RenderingContext,
    toTexture: boolean,
    viewport: Viewport,
    objects: T[]
  ): void;
}

export interface RenderObject {
  readonly program: RenderObjectProgram<this>;
}
