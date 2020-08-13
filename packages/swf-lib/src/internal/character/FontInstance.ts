import { CharacterInstance } from "./CharacterInstance";
import { FontCharacter, FontLayout } from "../../classes/__internal/character";
import type { AssetLibrary } from "../../classes/__internal";
import { makeShapeRenderObject, joinSpriteShapes } from "./shapes";
import { SpriteDef } from "../render/objects/RenderObjectSprite";

export class FontInstance implements CharacterInstance {
  readonly glyphSprites: SpriteDef[];
  readonly charMap = new Map<string, number>();
  readonly layout?: FontLayout;

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
    for (let i = 0; i < font.glyphs.length; i++) {
      const char = font.glyphs[i].char;
      if (char) {
        this.charMap.set(char, i);
      }
    }

    this.layout = font.layout && {
      ascent: font.layout.ascent / 20 / 1024,
      descent: font.layout.descent / 20 / 1024,
      leading: font.layout.ascent / 20 / 1024,
      advances: font.layout.advances.map((v) => v / 20 / 1024),
    };
  }
}
