import { CharacterInstance } from "./CharacterInstance";
import { FontCharacter } from "../../classes/_internal/character";
import type { AssetLibrary } from "../../classes/_internal";
import { makeShapeRenderObject, joinSpriteShapes } from "./shapes";
import { SpriteDef } from "../render/objects/RenderObjectSprite";

export class FontInstance implements CharacterInstance {
  readonly glyphSprites: SpriteDef[];

  constructor(
    readonly id: number,
    readonly font: FontCharacter,
    lib: AssetLibrary
  ) {
    this.glyphSprites = font.glyphs.map((glyph) => {
      const sprites = glyph.shape.contours.map((c) =>
        makeShapeRenderObject(c, lib)
      );
      return joinSpriteShapes(sprites);
    });
  }
}
