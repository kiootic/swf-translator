import { Shader } from "../Shader";

export const vertBasic = Shader.vertex(
  `
attribute vec4 aVertex;
attribute vec4 aColor;
attribute float aMode;
uniform mat3 uProjectionMatrix;

varying vec2 vTextureCoords;
varying vec4 vColor;
varying float vMode;

void main(void) {
    vec2 pos = aVertex.xy;
    vec2 uv = aVertex.zw;
    gl_Position = vec4((uProjectionMatrix * vec3(pos, 1.0)).xy, 0.0, 1.0);

    vTextureCoords = uv;
    vColor = aColor.bgra;
    vMode = aMode;
}
`,
  {
    aVertex: { type: "float", components: 4 },
    aColor: { type: "byte", components: 4, normalized: true },
    aMode: { type: "byte", components: 1 },
  },
  {
    uProjectionMatrix: "mat3",
  }
);
