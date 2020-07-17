import { Parser, object, uint8 } from "../binary";

export interface Rect {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export const rect: Parser<Rect> = (reader) => {
  const nBits = reader.nextBits(5);
  return {
    xMin: reader.nextSBits(nBits),
    xMax: reader.nextSBits(nBits),
    yMin: reader.nextSBits(nBits),
    yMax: reader.nextSBits(nBits),
  };
};

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
