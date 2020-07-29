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

const fragBlur = Shader.fragment(
  `
precision highp float;

varying vec2 vTextureCoords;

uniform sampler2D uTexture;
uniform vec2 uDelta;

vec4 sample(vec2 coords) {
  return texture2D(uTexture, coords).aaaa;
}

void main(void) {
    gl_FragColor = vec4(0.0);
    for (int i = -8; i <= 8; i++) {
      gl_FragColor += sample(vTextureCoords + uDelta * float(i)) / 17.0;
    }
}
`,
  {
    uTexture: "int",
    uDelta: "vec2",
  }
);

export const programBlur = new Program(vertBlur, fragBlur);
