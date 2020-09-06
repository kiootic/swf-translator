import { vec2, mat2d, vec4 } from "gl-matrix";
import { TextFormat, TextFormatAlign } from "../../flash/text";
import { Texture } from "../../../internal/render/Texture";
import { RenderObject } from "../../../internal/render2/RenderObject";
import { preMultiplyAlpha } from "../../../internal/math/color";
import { rect } from "../../../internal/math/rect";
import { FontRegistry } from "../FontRegistry";
import { FillStyleKind } from "../character/styles";
import { TextSegment } from "./TextSegment";

export interface LayoutResult {
  bounds: rect;
  renderObjects: RenderObject[];
}

interface Glyph {
  renderObjects: RenderObject[];
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
  const resultObjects: RenderObject[] = [];
  let y = 0;
  for (const line of lines) {
    const lineResult = layoutLine(line, y, bounds);
    resultObjects.push(...lineResult.renderObjects);
    rect.union(resultBounds, resultBounds, lineResult.bounds);
    y += lineResult.bounds[3];
  }

  return { bounds: resultBounds, renderObjects: resultObjects };
}

function fontSize(format: TextFormat) {
  // http://www.moock.org/blog/archives/000284.html
  return Math.min(127, format.size);
}

function placeholderGlyph(format: TextFormat): Glyph {
  return {
    renderObjects: [],
    color: format.color,
    align: format.align,
    size: fontSize(format),
    leading: format.leading,
    advance: fontSize(format),
    ascent: fontSize(format),
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
    renderObjects: font.glyphs[index].renderObjects,
    color: format.color,
    align: format.align,
    size: fontSize(format),
    leading: format.leading,
    advance: (font.layout?.advances[index] ?? 0) * fontSize(format),
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

  const boundsX = bounds[0] + 2;
  const boundsWidth = bounds[2] - 4;

  const alignment = line.glyphs[0].align;
  let spacing: number, x: number;
  switch (alignment) {
    case TextFormatAlign.RIGHT:
      spacing = 0;
      x = boundsX + boundsWidth - line.width;
      break;
    case TextFormatAlign.CENTER:
      spacing = 0;
      x = boundsX + (boundsWidth - line.width) / 2;
      break;
    case TextFormatAlign.JUSTIFY:
      spacing =
        line.glyphs.length > 0
          ? boundsX + (boundsWidth - line.width) / (line.glyphs.length - 1)
          : 0;
      x = 0;
      break;
    default:
      spacing = 0;
      x = boundsX;
      break;
  }

  interface GlyphInstance {
    renderObject: RenderObject;
    color: number;
    transform: mat2d;
  }

  const instances: GlyphInstance[] = [];

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

  const v = vec2.create();
  for (const g of line.glyphs) {
    const transform = mat2d.create();
    mat2d.fromTranslation(transform, [x, y + baseline]);
    mat2d.scale(transform, transform, [g.size / 1024, g.size / 1024]);

    const color = preMultiplyAlpha(g.color);

    for (const renderObject of g.renderObjects) {
      instances.push({
        renderObject,
        color,
        transform,
      });
    }
    x += g.advance + spacing;
  }

  return {
    bounds: rect.fromValues(0, y, x, y + leading),
    renderObjects: RenderObject.merge(instances),
  };
}
