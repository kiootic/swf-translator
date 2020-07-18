import { Gradient as SWFGradient } from "../format/structs/gradient";
import { color } from "./primitives";

export enum GradientMode {
  Pad = 0,
}

export interface Gradient {
  mode: GradientMode;
  points: [number, number][];
}

export function gradient(grad: SWFGradient): Gradient {
  let mode: GradientMode;
  switch (grad.spreadMode) {
    case 0:
      mode = GradientMode.Pad;
      break;
    default:
      throw new Error(`unsupported gradient mode: ${grad.spreadMode}`);
  }
  return {
    mode,
    points: grad.gradientRecords.map((r) => [r.ratio, color(r.color)]),
  };
}
