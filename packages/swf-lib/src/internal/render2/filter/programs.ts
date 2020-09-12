import { Program } from "../gl/Program";
import { blurVertexShader, blurFragmentShader } from "../programs/blur";
import { shadowVertexShader, shadowFragmentShader } from "../programs/shadow";
import { Buffer } from "../gl/Buffer";
import { VertexArray } from "../gl/VertexArray";

const programBlurCache = new Map<number, Program>();

export const programBlur = (blurRadius: number) => {
  const kernelWidth = Math.max(1, Math.ceil(blurRadius / 2));
  let prog = programBlurCache.get(kernelWidth);
  if (!prog) {
    prog = new Program(blurVertexShader, blurFragmentShader(kernelWidth));
    programBlurCache.set(kernelWidth, prog);
  }
  return prog;
};
export const programShadow = new Program(
  shadowVertexShader,
  shadowFragmentShader
);

export const maxRect = 100;
export const indices = Buffer.index(
  new Uint16Array(maxRect * 6),
  "STREAM_DRAW"
);

const attrData = new ArrayBuffer(maxRect * 4 * 68);
export const attrFloat = new Float32Array(attrData);
export const attrUint = new Uint32Array(attrData);
export const attrs = Buffer.vertex(attrFloat, "STREAM_DRAW");
export const vertexArray = new VertexArray(
  [
    {
      index: 0,
      buffer: attrs,
      type: "float",
      components: 4,
      offset: 0,
      stride: 68,
    },
    {
      index: 1,
      buffer: attrs,
      type: "float",
      components: 4,
      offset: 16,
      stride: 68,
    },
    {
      index: 2,
      buffer: attrs,
      type: "float",
      components: 4,
      offset: 32,
      stride: 68,
    },
    {
      index: 3,
      buffer: attrs,
      type: "float",
      components: 4,
      offset: 48,
      stride: 68,
    },
    {
      index: 4,
      buffer: attrs,
      type: "uint",
      components: 1,
      integer: true,
      offset: 64,
      stride: 68,
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
