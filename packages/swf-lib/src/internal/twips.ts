export const TWIPS = 20;

export function twipsToPixel(value: number) {
  return value / TWIPS;
}

export function pixelToTwips(value: number) {
  return Math.floor(value * TWIPS);
}
