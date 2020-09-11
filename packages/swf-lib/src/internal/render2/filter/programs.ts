import { Program } from "../gl/Program";
import { blurVertexShader, blurFragmentShader } from "../programs/blur";
import { Buffer } from "../gl/Buffer";
import { VertexArray } from "../gl/VertexArray";

export const programBlur = new Program(blurVertexShader, blurFragmentShader);

export const maxRect = 100;
export const indices = Buffer.index(
  new Uint16Array(maxRect * 6),
  "STREAM_DRAW"
);
export const attrs = Buffer.vertex(
  new Float32Array(maxRect * 4 * 16),
  "STREAM_DRAW"
);
export const vertexArray = new VertexArray(
  [
    {
      index: 0,
      buffer: attrs,
      type: "float",
      components: 4,
      offset: 0,
      stride: 64,
    },
    {
      index: 1,
      buffer: attrs,
      type: "float",
      components: 4,
      offset: 16,
      stride: 64,
    },
    {
      index: 2,
      buffer: attrs,
      type: "float",
      components: 4,
      offset: 32,
      stride: 64,
    },
    {
      index: 3,
      buffer: attrs,
      type: "float",
      components: 4,
      offset: 48,
      stride: 64,
    },
  ],
  indices
);

for (let i = 0; i < maxRect; i++) {
  indices.data[i * 6 + 0] = i * 4 + 0;
  indices.data[i * 6 + 1] = i * 4 + 1;
  indices.data[i * 6 + 2] = i * 4 + 2;
  indices.data[i * 6 + 3] = i * 4 + 1;
  indices.data[i * 6 + 4] = i * 4 + 0;
  indices.data[i * 6 + 5] = i * 4 + 3;
}
