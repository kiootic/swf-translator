import { Parser, fixed, sBits } from "../../binary";

export interface Rect {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export const rect: Parser<Rect> = (reader) => {
  const nBits = reader.nextBits(5);
  const rect: Rect = {
    xMin: reader.nextSBits(nBits),
    xMax: reader.nextSBits(nBits),
    yMin: reader.nextSBits(nBits),
    yMax: reader.nextSBits(nBits),
  };
  reader.flushBits();
  return rect;
};

export interface Matrix {
  scaleX: number;
  scaleY: number;
  rotateSkew0: number;
  rotateSkew1: number;
  translateX: number;
  translateY: number;
}

export const matrix: Parser<Matrix> = (reader) => {
  const matrix: Matrix = {
    scaleX: 1,
    scaleY: 1,
    rotateSkew0: 0,
    rotateSkew1: 0,
    translateX: 0,
    translateY: 0,
  };

  const hasScale = reader.nextBitBool();
  if (hasScale) {
    const nBits = reader.nextBits(5);
    matrix.scaleX = fixed(sBits(nBits))(reader);
    matrix.scaleY = fixed(sBits(nBits))(reader);
  }
  const hasRotate = reader.nextBitBool();
  if (hasRotate) {
    const nBits = reader.nextBits(5);
    matrix.rotateSkew0 = fixed(sBits(nBits))(reader);
    matrix.rotateSkew1 = fixed(sBits(nBits))(reader);
  }
  const nBits = reader.nextBits(5);
  matrix.translateX = sBits(nBits)(reader);
  matrix.translateY = sBits(nBits)(reader);

  reader.flushBits();
  return matrix;
};
