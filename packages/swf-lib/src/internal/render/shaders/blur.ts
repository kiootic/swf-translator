import { Shader } from "../Shader";
import { Program } from "../Program";

const vertBlur = Shader.vertex(
  `
attribute vec2 aVertex;
uniform mat3 uProjectionMatrix;

varying vec2 vTextureCoords;

void main(void) {
    gl_Position = vec4((uProjectionMatrix * vec3(aVertex, 1.0)).xy, 0.0, 1.0);
    vTextureCoords = aVertex;
}
`,
  {
    aVertex: { type: "float", components: 2 },
  },
  {
    uProjectionMatrix: "mat3",
  }
);

const fragBlur = (quality: number) =>
  Shader.fragment(
    `
precision highp float;

varying vec2 vTextureCoords;

uniform sampler2D uTexture;
uniform vec2 uDelta;

vec4 sample(vec2 coords) {
  return texture2D(uTexture, coords);
}

void main(void) {
    gl_FragColor = vec4(0.0);
    for (int i = -${quality}; i <= ${quality}; i++) {
      gl_FragColor += sample(vTextureCoords + uDelta * float(i)) / (${
        quality * 2 + 1
      }.0);
    }
}
`,
    {
      uTexture: "int",
      uDelta: "vec2",
    }
  );

const fragBlurCache = new Map<number, Shader>();

export const programBlur = (quality: number) => {
  let fragBlurInstance = fragBlurCache.get(quality);
  if (!fragBlurInstance) {
    fragBlurInstance = fragBlur(quality);
    fragBlurCache.set(quality, fragBlurInstance);
  }
  return new Program(vertBlur, fragBlurInstance);
};
