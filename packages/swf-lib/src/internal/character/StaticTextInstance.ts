import { mat2d, vec2, vec4 } from "gl-matrix";
import { StaticText } from "../../classes/flash/text/StaticText";
import { CharacterInstance } from "./CharacterInstance";
import { StaticTextCharacter } from "../../classes/_internal/character";
import { AssetLibrary } from "../../classes/_internal";
import { FillStyleKind } from "../../classes/_internal/character/styles";
import {
  SpriteDef,
  RenderObjectSprite,
} from "../render/objects/RenderObjectSprite";
import { Texture } from "../render/Texture";
import { rect } from "../math/rect";

export class StaticTextInstance implements CharacterInstance {
  readonly sprites: SpriteDef[] = [];
  readonly bounds: rect;

  constructor(
    readonly id: number,
    text: StaticTextCharacter,
    lib: AssetLibrary
  ) {
    this.bounds = text.bounds;

    const matrix = mat2d.fromValues(...text.matrix);
    interface GlyphInstance {
      matrix: mat2d;
      bounds: rect;
      vertices: Float32Array;
    }

    let color = 0xfffffff;
    let numVertices = 0;
    const instances: GlyphInstance[] = [];
    const flushInstances = () => {
      if (instances.length === 0) {
        return;
      }

      const vertices = new Float32Array(numVertices);
      const bounds = rect.create();
      let i = 0;
      const v = vec2.create();
      for (const inst of instances) {
        const { vertices: glyphVertices, matrix, bounds: glyphBounds } = inst;
        for (let j = 0; j < glyphVertices.length / 2; j++) {
          vec2.set(v, glyphVertices[j * 2 + 0], glyphVertices[j * 2 + 1]);
          vec2.transformMat2d(v, v, matrix);
          vertices[i * 2 + 0] = v[0];
          vertices[i * 2 + 1] = v[1];
          i++;
        }
        rect.union(bounds, bounds, glyphBounds);
      }

      const vColor = vec4.fromValues(
        (color >>> 16) & 0xff,
        (color >>> 8) & 0xff,
        (color >>> 0) & 0xff,
        (color >>> 24) & 0xff
      );
      const def: SpriteDef = {
        vertices,
        uvMatrix: mat2d.identity(mat2d.create()),
        texture: Texture.WHITE,
        color: vColor,
        fillMode: FillStyleKind.SolidColor,
        bounds,
      };
      this.sprites.push(def);
      instances.length = 0;
      numVertices = 0;
    };

    for (const glyph of text.glyphs) {
      const font = lib.resolveFont(glyph.fontId);
      const sprite = font.glyphSprites[glyph.index];

      if (
        glyph.color !== color ||
        numVertices + sprite.vertices.length > 0x10000
      ) {
        flushInstances();
        color = glyph.color;
      }

      const glyphMatrix = mat2d.create();
      mat2d.translate(glyphMatrix, matrix, [glyph.x, glyph.y]);
      mat2d.scale(glyphMatrix, glyphMatrix, [
        glyph.size / 1024 / 20,
        glyph.size / 1024 / 20,
      ]);

      const bounds = rect.copy(rect.create(), sprite.bounds);
      rect.apply(bounds, bounds, glyphMatrix);

      instances.push({
        vertices: sprite.vertices,
        bounds,
        matrix: glyphMatrix,
      });
      numVertices += sprite.vertices.length;
    }

    flushInstances();
  }

  applyTo(staticText: StaticText) {
    for (const s of this.sprites) {
      staticText.__renderObjects.push(new RenderObjectSprite(s));
    }
    rect.copy(staticText.__bounds.__rect, this.bounds);
    staticText.__reportBoundsChanged();
  }
}