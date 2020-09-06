import { Shape } from "../../classes/flash/display/Shape";
import type { AssetLibrary } from "../../classes/__internal/AssetLibrary";
import { ShapeCharacter } from "../../classes/__internal/character/Shape";
import { CharacterInstance } from "./CharacterInstance";
import { makeShapeRenderObject } from "./shapes";
import { RenderObject } from "../render2/RenderObject";
import { rect } from "../math/rect";

export class ShapeInstance implements CharacterInstance {
  readonly renderObjects: RenderObject[];
  readonly bounds: rect;

  constructor(readonly id: number, def: ShapeCharacter, lib: AssetLibrary) {
    this.renderObjects = def.contours.map((c) => makeShapeRenderObject(c, lib));
    this.bounds = rect.create();
    for (const def of this.renderObjects) {
      rect.union(this.bounds, this.bounds, def.bounds);
    }
  }

  applyTo(container: Shape) {
    container.__node.setRenderObjects(this.renderObjects, this.bounds);
  }
}
