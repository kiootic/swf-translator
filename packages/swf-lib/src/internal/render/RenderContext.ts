import type { Renderer } from "./Renderer";
import { RenderObject } from "./RenderObject";

export class RenderContext {
  readonly objects: RenderObject[] = [];

  constructor(readonly renderer: Renderer) {}

  render(obj: RenderObject) {
    this.objects.push(obj);
  }
}
