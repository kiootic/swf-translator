import { Shader } from "../Shader";

export const vertBasic = Shader.vertex(
  `
attribute vec4 aVertex;
attribute vec4 aColorMul;
attribute vec4 aColorAdd;
attribute float aMode;
uniform mat3 uProjectionMatrix;

varying vec2 vTextureCoords;
varying vec4 vColorMul;
varying vec4 vColorAdd;
varying float vMode;

void main(void) {
    vec2 pos = aVertex.xy;
    vec2 uv = aVertex.zw;
    gl_Position = vec4((uProjectionMatrix * vec3(pos, 1.0)).xy, 0.0, 1.0);

    vTextureCoords = uv;
    vColorMul = aColorMul;
    vColorAdd = aColorAdd;
    vMode = aMode;
}
`,
  {
    aVertex: { type: "float", components: 4 },
    aColorMul: { type: "float", components: 4 },
    aColorAdd: { type: "float", components: 4 },
    aMode: { type: "byte", components: 1 },
  },
  {
    uProjectionMatrix: "mat3",
  }
);
