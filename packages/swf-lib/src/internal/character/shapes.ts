import { mat2d } from "gl-matrix";
import { RenderObject } from "../render2/RenderObject";
import type { AssetLibrary } from "../../classes/__internal/AssetLibrary";
import { ShapeContour } from "../../classes/__internal/character/Shape";
import { FillStyleKind } from "../../classes/__internal/character/styles";
import { makeGradientTexture, gradientKey } from "./gradient";
import { rect } from "../math/rect";
import { preMultiplyAlpha } from "../math/color";

export function makeShapeRenderObject(
  contour: ShapeContour,
  lib: AssetLibrary
): RenderObject {
  const vertices = new Float32Array(contour.vertices);
  const indices = new Uint16Array(contour.indices);

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let i = 0; i < contour.vertices.length; i += 2) {
    const x = vertices[i + 0];
    const y = vertices[i + 1];

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const bounds = rect.fromValues(minX, minY, maxX - minX, maxY - minY);

  let texture = null;
  let color: number = 0xffffffff;
  const uvMatrix = mat2d.identity(mat2d.create());
  switch (contour.fill.kind) {
    case FillStyleKind.SolidColor:
      color = preMultiplyAlpha(contour.fill.color);
      break;

    case FillStyleKind.LinearGradient:
    case FillStyleKind.RadicalGradient:
      const key = gradientKey(contour.fill.gradient);
      texture = lib.gradientCache.get(key);
      if (!texture) {
        texture = makeGradientTexture(contour.fill.gradient);
        lib.gradientCache.set(key, texture);
      }

      mat2d.set(uvMatrix, ...contour.fill.matrix);
      convertMatrix(uvMatrix, 32768, 32768, 0.5);
      break;

    case FillStyleKind.ClippedBitmap:
      texture = lib.resolveImage(contour.fill.characterId);

      mat2d.set(uvMatrix, ...contour.fill.matrix);
      convertMatrix(uvMatrix, texture.width, texture.height, 0);
      break;
  }

  const colors = new Uint32Array(vertices.length / 2);
  colors.fill(color);

  return new RenderObject(
    "shape",
    vertices,
    colors,
    indices,
    uvMatrix,
    texture,
    contour.fill.kind,
    bounds
  );
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
