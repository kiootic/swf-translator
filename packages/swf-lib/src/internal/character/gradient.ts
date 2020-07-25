import { Gradient } from "../../classes/_internal/character/styles";

export function makeGradientTexture(gradient: Gradient): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext("2d")!;

  const lg = ctx.createLinearGradient(0, 0, canvas.width, 0);
  for (const [ratio, color] of gradient.points) {
    const a = (color >>> 24) & 0xff;
    const r = (color >>> 16) & 0xff;
    const g = (color >>> 8) & 0xff;
    const b = (color >>> 0) & 0xff;
    lg.addColorStop(ratio / 255, `rgba(${r}, ${g}, ${b}, ${a / 255})`);
  }

  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return canvas;
}
