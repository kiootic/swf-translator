import { Shape } from "../../classes/flash/display/Shape";
import type { AssetLibrary } from "../../classes/__internal/AssetLibrary";
import { ShapeCharacter } from "../../classes/__internal/character/Shape";
import { CharacterInstance } from "./CharacterInstance";
import { makeShapeRenderObject } from "./shapes";
import {
  SpriteDef,
  RenderObjectSprite,
} from "../render/objects/RenderObjectSprite";
import { rect } from "../math/rect";

export class ShapeInstance implements CharacterInstance {
  readonly sprites: SpriteDef[];
  readonly bounds: rect;

  constructor(readonly id: number, def: ShapeCharacter, lib: AssetLibrary) {
    this.sprites = def.contours.map((c) => makeShapeRenderObject(c, lib));
    this.bounds = rect.create();
    for (const def of this.sprites) {
      rect.union(this.bounds, this.bounds, def.bounds);
    }
  }

  applyTo(container: Shape) {
    const objects: RenderObjectSprite[] = [];
    for (const s of this.sprites) {
      objects.push(new RenderObjectSprite(s));
    }
    container.__node.setRenderObjects(objects, this.bounds);
  }
}
