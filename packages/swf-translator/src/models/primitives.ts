import {
  RGB,
  RGBA,
  ARGB,
  Matrix as SWFMatrix,
  Rect as SWFRect,
  ColorTransformWithAlpha,
} from "../format/structs";

export function color(color: RGB | RGBA | ARGB): number {
  let c =
    Math.round(color.red) * 0x10000 +
    Math.round(color.green) * 0x100 +
    Math.round(color.blue) * 0x1;
  if ("alpha" in color) {
    c = Math.round(color.alpha) * 0x1000000 + c;
  }
  return c;
}

export type ColorTransform = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

export function colorTransform(
  m: ColorTransformWithAlpha
): ColorTransform | undefined {
  const result: ColorTransform = [
    m.redMul / 256,
    m.greenMul / 256,
    m.blueMul / 256,
    m.alphaMul / 256,
    m.redAdd,
    m.greenAdd,
    m.blueAdd,
    m.alphaAdd,
  ];
  for (let i = 0; i < result.length; i++) {
    if (result[i] !== [1, 1, 1, 1, 0, 0, 0, 0][i]) {
      return result;
    }
  }
  return undefined;
}

export type Matrix = [number, number, number, number, number, number];
export function matrix(m: SWFMatrix): Matrix {
  return [
    m.scaleX,
    m.rotateSkew0,
    m.rotateSkew1,
    m.scaleY,
    m.translateX,
    m.translateY,
  ];
}

export type Rect = [number, number, number, number];
export function rect(r: SWFRect): Rect {
  return [r.xMin, r.yMin, r.xMax - r.xMin, r.yMax - r.yMin];
}
