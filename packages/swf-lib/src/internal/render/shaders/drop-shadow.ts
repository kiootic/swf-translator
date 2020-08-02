import { Shader } from "../Shader";
import { Program } from "../Program";

const vertDropShadow = Shader.vertex(
  `
attribute vec2 aVertex;
uniform mat3 uProjectionMatrix;
uniform vec2 uOffset;

varying vec2 vTextureCoords;

void main(void) {
    gl_Position = vec4((uProjectionMatrix * vec3(aVertex, 1.0)).xy, 0.0, 1.0);
    vTextureCoords = aVertex - uOffset;
}
`,
  {
    aVertex: { type: "float", components: 2 },
  },
  {
    uProjectionMatrix: "mat3",
    uOffset: "vec2",
  }
);

const fragDropShadow = Shader.fragment(
  `
precision highp float;

varying vec2 vTextureCoords;

uniform sampler2D uTexture;
uniform vec4 uColor;

void main(void) {
    float alpha = texture2D(uTexture, vTextureCoords).a;
    vec4 colorShadow = uColor * alpha;
    gl_FragColor = colorShadow;
}
`,
  {
    uTexture: "int",
    uColor: "vec4",
  }
);

export const programDropShadow = new Program(vertDropShadow, fragDropShadow);
