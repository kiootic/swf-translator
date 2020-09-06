import { mat2d, vec2, vec4 } from "gl-matrix";
import { StaticText } from "../../classes/flash/text/StaticText";
import { CharacterInstance } from "./CharacterInstance";
import { StaticTextCharacter } from "../../classes/__internal/character";
import { AssetLibrary } from "../../classes/__internal";
import { RenderObject } from "../render2/RenderObject";
import { rect } from "../math/rect";
import { preMultiplyAlpha } from "../math/color";

export class StaticTextInstance implements CharacterInstance {
  readonly renderObjects: RenderObject[] = [];
  readonly bounds: rect;

  constructor(
    readonly id: number,
    text: StaticTextCharacter,
    lib: AssetLibrary
  ) {
    this.bounds = rect.scale(
      rect.create(),
      rect.fromValues(...text.bounds),
      1 / 20
    );

    const matrix = mat2d.fromValues(...text.matrix);
    matrix[4] /= 20;
    matrix[5] /= 20;

    interface GlyphInstance {
      renderObject: RenderObject;
      color: number;
      transform: mat2d;
    }

    const instances: GlyphInstance[] = [];
    for (const g of text.glyphs) {
      const font = lib.resolveFont(g.fontId);
      const glyph = font.glyphs[g.index];

      const transform = mat2d.create();
      mat2d.translate(transform, matrix, [g.x / 20, g.y / 20]);
      mat2d.scale(transform, transform, [
        g.size / 1024 / 20,
        g.size / 1024 / 20,
      ]);

      const color = preMultiplyAlpha(g.color);

      for (const object of glyph.renderObjects) {
        instances.push({
          renderObject: object,
          color,
          transform,
        });
      }
    }

    this.renderObjects = RenderObject.merge(instances);
  }

  applyTo(staticText: StaticText) {
    staticText.__node.setRenderObjects(this.renderObjects, this.bounds);
  }
}
