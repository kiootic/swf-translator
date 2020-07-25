import { Shape } from "../../classes/flash/display/Shape";
import type { AssetLibrary } from "../../classes/_internal/AssetLibrary";
import { ShapeCharacter } from "../../classes/_internal/character/Shape";
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
    this.bounds = def.bounds;
  }

  applyTo(container: Shape) {
    for (const s of this.sprites) {
      container.__renderObjects.push(new RenderObjectSprite(s));
    }
    rect.copy(container.__bounds.__rect, this.bounds);
    container.__reportBoundsChanged();
  }
}
