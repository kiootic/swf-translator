import { Screen } from "./Screen";

export interface RenderObjectProgram<T extends RenderObject> {
  render(gl: WebGL2RenderingContext, screen: Screen, objects: T[]): void;
}

export interface RenderObject {
  readonly program: RenderObjectProgram<this>;
}
