import { Parser, object, uint8, transform, Reader, sBits } from "../../binary";

export interface RGB {
  red: number;
  green: number;
  blue: number;
}

export const rgb = object<RGB>(
  ["red", uint8],
  ["green", uint8],
  ["blue", uint8]
);

export interface ARGB {
  alpha: number;
  red: number;
  green: number;
  blue: number;
}

export const argb = object<ARGB>(
  ["alpha", uint8],
  ["red", uint8],
  ["green", uint8],
  ["blue", uint8]
);

export interface RGBA {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

export const rgba = object<RGBA>(
  ["red", uint8],
  ["green", uint8],
  ["blue", uint8],
  ["alpha", uint8]
);

export const rgb2rgba: Parser<RGBA> = transform(rgb, (rgb) => ({
  ...rgb,
  alpha: 255,
}));

export interface ColorTransformWithAlpha {
  redMul: number;
  greenMul: number;
  blueMul: number;
  alphaMul: number;
  redAdd: number;
  greenAdd: number;
  blueAdd: number;
  alphaAdd: number;
}

export function colorTransformWithAlpha(
  reader: Reader
): ColorTransformWithAlpha {
  const cxform: ColorTransformWithAlpha = {
    redMul: 1,
    greenMul: 1,
    blueMul: 1,
    alphaMul: 1,
    redAdd: 0,
    greenAdd: 0,
    blueAdd: 0,
    alphaAdd: 0,
  };

  const hasAdd = reader.nextBitBool();
  const hasMul = reader.nextBitBool();
  const nBits = reader.nextBits(4);
  if (hasMul) {
    cxform.redMul = sBits(nBits)(reader);
    cxform.greenMul = sBits(nBits)(reader);
    cxform.blueMul = sBits(nBits)(reader);
    cxform.alphaMul = sBits(nBits)(reader);
  }
  if (hasAdd) {
    cxform.redAdd = sBits(nBits)(reader);
    cxform.greenAdd = sBits(nBits)(reader);
    cxform.blueAdd = sBits(nBits)(reader);
    cxform.alphaAdd = sBits(nBits)(reader);
  }

  reader.flushBits();
  return cxform;
}
