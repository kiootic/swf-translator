import {
  RGB,
  RGBA,
  ARGB,
  Matrix as SWFMatrix,
  Rect as SWFRect,
} from "../format/structs";

export function color(color: RGB | RGBA | ARGB): number {
  let c = color.red * 0x10000 + color.green * 0x100 + color.blue * 0x1;
  if ("alpha" in color) {
    c = color.alpha * 0x1000000 + c;
  }
  return c;
}

export type Matrix = [number, number, number, number, number, number];
export function matrix(m: SWFMatrix): Matrix {
  return [
    m.scaleX,
    m.rotateSkew0,
    m.translateX,
    m.rotateSkew1,
    m.scaleY,
    m.translateY,
  ];
}
