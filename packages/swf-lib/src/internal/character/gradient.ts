import { Gradient } from "../../classes/__internal/character/styles";

export function gradientKey(gradient: Gradient) {
  return `${gradient.mode};${gradient.points
    .map(([ratio, color]) => `${ratio}:${color}`)
    .join(";")}`;
}

function lerpInt(ratio: number, a: number, b: number) {
  return Math.round(a + (b - a) * ratio);
}

export function makeGradientTexture(gradient: Gradient): HTMLCanvasElement {
  // NOTE: need to interploate colors using non-premultiplied alpha.
  // canvas operations uses premultiplied alpha.
  // manually render the gradient.
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;

  const ctx = canvas.getContext("2d")!;

  const data = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) {
    let b = gradient.points.findIndex(([pt, _]) => pt >= i);
    let a: number;
    if (b === -1) {
      a = gradient.points.length - 1;
      b = gradient.points.length - 1;
    } else if (b === 0) {
      a = 0;
    } else {
      a = b - 1;
    }

    const [ptA, colorA] = gradient.points[a];
    const [ptB, colorB] = gradient.points[b];
    const ratio = ptA === ptB ? 1 : (i - ptA) / (ptB - ptA);

    data[i * 4 + 3] = lerpInt(
      ratio,
      (colorA >>> 24) & 0xff,
      (colorB >>> 24) & 0xff
    );
    data[i * 4 + 0] = lerpInt(
      ratio,
      (colorA >>> 16) & 0xff,
      (colorB >>> 16) & 0xff
    );
    data[i * 4 + 1] = lerpInt(
      ratio,
      (colorA >>> 8) & 0xff,
      (colorB >>> 8) & 0xff
    );
    data[i * 4 + 2] = lerpInt(
      ratio,
      (colorA >>> 0) & 0xff,
      (colorB >>> 0) & 0xff
    );
  }

  ctx.putImageData(new ImageData(data, 256, 1), 0, 0);

  return canvas;
}
