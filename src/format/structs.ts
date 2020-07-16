import { Parser } from "../binary";

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
