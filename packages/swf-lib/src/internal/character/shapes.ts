import { mat2d, vec4 } from "gl-matrix";
import { SpriteDef } from "../render/objects/RenderObjectSprite";
import { Texture } from "../render/Texture";
import type { AssetLibrary } from "../../classes/_internal/AssetLibrary";
import { ShapeContour } from "../../classes/_internal/character/Shape";
import { FillStyleKind } from "../../classes/_internal/character/styles";
import { makeGradientTexture } from "./gradient";
import { rect } from "../math/rect";
import { preMultiplyAlpha } from "../math/color";

export function makeShapeRenderObject(
  contour: ShapeContour,
  lib: AssetLibrary
): SpriteDef {
  const vertices = new Float32Array(contour.indices.length * 2);
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let i = 0; i < contour.indices.length; i++) {
    const index = contour.indices[i];

    const x = contour.vertices[index * 2 + 0];
    const y = contour.vertices[index * 2 + 1];
    vertices[i * 2 + 0] = x;
    vertices[i * 2 + 1] = y;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const bounds = rect.fromValues(minX, minY, maxX - minX, maxY - minY);

  let texture = Texture.WHITE;
  let color: vec4 | null = null;
  const uvMatrix = mat2d.identity(mat2d.create());
  switch (contour.fill.kind) {
    case FillStyleKind.SolidColor:
      color = preMultiplyAlpha(vec4.create(), contour.fill.color);
      break;

    case FillStyleKind.LinearGradient:
    case FillStyleKind.RadicalGradient:
      texture = new Texture(makeGradientTexture(contour.fill.gradient));

      mat2d.set(uvMatrix, ...contour.fill.matrix);
      convertMatrix(uvMatrix, 32768, 32768, 0.5);
      break;

    case FillStyleKind.ClippedBitmap:
      texture = lib.resolveImage(contour.fill.characterId);

      mat2d.set(uvMatrix, ...contour.fill.matrix);
      convertMatrix(uvMatrix, texture.width, texture.height, 0);
      break;
  }

  return {
    vertices,
    bounds,
    uvMatrix,
    texture,
    color,
    fillMode: contour.fill.kind,
  };
}

// https://github.com/ruffle-rs/ruffle/blob/09ca11f788ef5c5efa45a40d96e3cbe5be9e940b/render/common_tess/src/lib.rs#L344
function convertMatrix(
  mat: mat2d,
  width: number,
  height: number,
  offset: number
) {
  mat2d.invert(mat, mat);
  mat2d.scale(mat, mat, [1 / width, 1 / height]);
  mat[4] = mat[4] / width + offset;
  mat[5] = mat[5] / height + offset;
}

export function joinSpriteShapes(defs: SpriteDef[]): SpriteDef {
  let dataLength = 0;
  const bounds = rect.create();
  for (const s of defs) {
    dataLength += s.vertices.length;
    rect.union(bounds, bounds, s.bounds);
  }

  const def: SpriteDef = {
    vertices: new Float32Array(dataLength),
    bounds,
    uvMatrix: mat2d.identity(mat2d.create()),
    texture: Texture.WHITE,
    color: null,
    fillMode: FillStyleKind.SolidColor,
  };

  let i = 0;
  for (const s of defs) {
    def.vertices.set(s.vertices, i);
    i += s.vertices.length;
  }
  return def;
}
