import { mat2d } from "gl-matrix";
import { makeShapeRenderObject } from "./shapes";
import { CharacterInstance } from "./CharacterInstance";
import { FontCharacter, FontLayout } from "../../classes/__internal/character";
import type { AssetLibrary } from "../../classes/__internal";
import { RenderObject } from "../render2/RenderObject";

export interface FontGlyph {
  renderObjects: RenderObject[];
}

export class FontInstance implements CharacterInstance {
  readonly glyphs: FontGlyph[];
  readonly charMap = new Map<string, number>();
  readonly layout?: FontLayout;

  constructor(
    readonly id: number,
    readonly font: FontCharacter,
    lib: AssetLibrary
  ) {
    this.glyphs = font.glyphs.map((glyph) => {
      const renderObjects = glyph.shape.contours.map((c) =>
        makeShapeRenderObject(c, lib)
      );
      return {
        renderObjects: RenderObject.merge(
          "text",
          renderObjects.map((renderObject) => ({
            renderObject,
            transform: mat2d.identity(mat2d.create()),
          }))
        ),
      };
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
