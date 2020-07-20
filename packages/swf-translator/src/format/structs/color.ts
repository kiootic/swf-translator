import { Parser, object, uint8, transform } from "../../binary";

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
