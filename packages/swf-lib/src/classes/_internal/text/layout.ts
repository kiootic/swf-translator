import { vec2, mat2d, vec4 } from "gl-matrix";
import { TextFormat, TextFormatAlign } from "../../flash/text";
import { Texture } from "../../../internal/render/Texture";
import {
  RenderObjectSprite,
  SpriteDef,
} from "../../../internal/render/objects/RenderObjectSprite";
import { preMultiplyAlpha } from "../../../internal/math/color";
import { rect } from "../../../internal/math/rect";
import { FontRegistry } from "../FontRegistry";
import { FillStyleKind } from "../character/styles";
import { TextSegment } from "./TextSegment";

export interface LayoutResult {
  bounds: rect;
  renderObjects: RenderObjectSprite[];
}

interface Glyph {
  sprite: SpriteDef;
  color: number;
  align: TextFormatAlign;
  size: number;
  leading: number;
  advance: number;
  ascent: number;
  descent: number;
}

interface Line {
  glyphs: Glyph[];
  width: number;
}

export function layout(
  segments: TextSegment[],
  bounds: rect,
  wrap: boolean,
  multiline: boolean
): LayoutResult {
  const lines = splitLines(segments, bounds, wrap, multiline);

  const resultBounds = rect.create();
  const resultObjects: RenderObjectSprite[] = [];
  let y = 0;
  for (const line of lines) {
    const lineResult = layoutLine(line, y, bounds);
    resultObjects.push(...lineResult.renderObjects);
    rect.union(resultBounds, resultBounds, lineResult.bounds);
    y += lineResult.bounds[3];
  }

  return { bounds: resultBounds, renderObjects: resultObjects };
}

function placeholderGlyph(format: TextFormat): Glyph {
  return {
    sprite: {
      vertices: new Float32Array(),
      uvMatrix: mat2d.create(),
      texture: Texture.WHITE,
      color: null,
      fillMode: FillStyleKind.SolidColor,
      bounds: rect.fromValues(0, -format.size, format.size, format.size),
    },
    color: format.color,
    align: format.align,
    size: format.size,
    leading: format.leading,
    advance: format.size,
    ascent: format.size,
    descent: 0,
  };
}

function resolveGlyph(format: TextFormat, char: string): Glyph {
  const font = FontRegistry.instance.resolve(
    format.font,
    format.italic,
    format.bold
  );
  if (!font) {
    return placeholderGlyph(format);
  }
  const index = font.charMap.get(char);
  if (index == null) {
    return placeholderGlyph(format);
  }

  return {
    sprite: font.glyphSprites[index],
    color: format.color,
    align: format.align,
    size: format.size,
    leading: format.leading,
    advance: (font.layout?.advances[index] ?? 0) * format.size,
    ascent: font.layout?.ascent ?? 0,
    descent: font.layout?.descent ?? 0,
  };
}

function splitLines(
  segments: TextSegment[],
  bounds: rect,
  wrap: boolean,
  multiline: boolean
): Line[] {
  let currentLine: Line = { glyphs: [], width: 0 };
  const lines = [currentLine];

  for (const { format, text } of segments) {
    for (const char of text) {
      if (multiline && char === "\n") {
        currentLine = { glyphs: [], width: 0 };
        lines.push(currentLine);
        continue;
      }

      const glyph = resolveGlyph(format, char);
      const advance = glyph.advance;
      if (wrap && currentLine.width + advance > bounds[2]) {
        currentLine = { glyphs: [], width: 0 };
        lines.push(currentLine);
      }
      currentLine.glyphs.push(glyph);
      currentLine.width += advance;
    }
  }
  return lines;
}

function layoutLine(line: Line, y: number, bounds: rect): LayoutResult {
  if (line.glyphs.length === 0) {
    return { bounds: rect.create(), renderObjects: [] };
  }

  const alignment = line.glyphs[0].align;
  let spacing: number, x: number;
  switch (alignment) {
    case TextFormatAlign.RIGHT:
      spacing = 0;
      x = bounds[0] + bounds[2] - line.width;
      break;
    case TextFormatAlign.CENTER:
      spacing = 0;
      x = bounds[0] + (bounds[2] - line.width) / 2;
      break;
    case TextFormatAlign.JUSTIFY:
      spacing =
        bounds[0] + line.glyphs.length > 0
          ? (bounds[2] - line.width) / (line.glyphs.length - 1)
          : 0;
      x = bounds[0];
      break;
    default:
      spacing = 0;
      x = bounds[0];
      break;
  }

  interface GlyphSprite {
    vertices: Float32Array;
    bounds: rect;
  }

  const objects: RenderObjectSprite[] = [];
  const sprites: GlyphSprite[] = [];
  let numVertices = 0;
  let color = 0xffffffff;
  const flush = () => {
    if (sprites.length === 0) {
      return;
    }

    const vertices = new Float32Array(numVertices);
    const spriteBounds = rect.create();
    let i = 0;
    for (const vs of sprites) {
      const { vertices: glyphVertices, bounds: glyphBounds } = vs;
      for (let j = 0; j < glyphVertices.length / 2; j++) {
        vertices[i * 2 + 0] = glyphVertices[j * 2 + 0];
        vertices[i * 2 + 1] = glyphVertices[j * 2 + 1];
        i++;
      }
      rect.union(spriteBounds, spriteBounds, glyphBounds);
    }

    const def: SpriteDef = {
      vertices,
      uvMatrix: mat2d.identity(mat2d.create()),
      texture: Texture.WHITE,
      color: preMultiplyAlpha(vec4.create(), color),
      fillMode: FillStyleKind.SolidColor,
      bounds: spriteBounds,
    };
    objects.push(new RenderObjectSprite(def));
    sprites.length = 0;
    numVertices = 0;
  };

  let baseline = 0;
  let leading = 0;
  for (const glyph of line.glyphs) {
    baseline = Math.max(baseline, glyph.ascent * glyph.size);
  }
  for (const glyph of line.glyphs) {
    leading = Math.max(
      leading,
      baseline + glyph.descent * glyph.size + glyph.leading
    );
  }

  const matrix = mat2d.create();
  const v = vec2.create();
  for (const glyph of line.glyphs) {
    if (glyph.color !== color) {
      flush();
      color = glyph.color;
    }

    const glyphBounds = rect.create();
    rect.scale(glyphBounds, glyph.sprite.bounds, glyph.size / 1024);
    rect.translate(glyphBounds, glyphBounds, [x, y + baseline]);

    mat2d.fromTranslation(matrix, [x, y + baseline]);
    mat2d.scale(matrix, matrix, [glyph.size / 1024, glyph.size / 1024]);

    const vertices = new Float32Array(glyph.sprite.vertices.length);
    for (let i = 0; i < vertices.length / 2; i++) {
      vec2.set(
        v,
        glyph.sprite.vertices[i * 2 + 0],
        glyph.sprite.vertices[i * 2 + 1]
      );
      vec2.transformMat2d(v, v, matrix);
      vertices[i * 2 + 0] = v[0];
      vertices[i * 2 + 1] = v[1];
    }
    sprites.push({ vertices, bounds: glyphBounds });
    numVertices += vertices.length;

    x += glyph.advance + spacing;
  }
  flush();

  return {
    bounds: rect.fromValues(0, y, x, y + leading),
    renderObjects: objects,
  };
}
