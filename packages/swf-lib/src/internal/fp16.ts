export function roundToFP1616(value: number) {
  return Math.trunc(value * 65536) / 65536;
}
