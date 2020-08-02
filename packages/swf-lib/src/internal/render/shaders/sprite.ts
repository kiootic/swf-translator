import { Shader } from "../Shader";
import { Program } from "../Program";

const vertSprite = Shader.vertex(
  `
attribute vec4 aVertex;
attribute vec4 aColorTint;
attribute vec4 aColorMul;
attribute vec4 aColorAdd;
attribute float aMode;
uniform mat3 uProjectionMatrix;
uniform float uDepth;

varying vec2 vTextureCoords;
varying vec4 vColorTint;
varying vec4 vColorMul;
varying vec4 vColorAdd;
varying float vMode;

void main(void) {
    vec2 pos = aVertex.xy;
    vec2 uv = aVertex.zw;
    gl_Position = vec4((uProjectionMatrix * vec3(pos, 1.0)).xy, uDepth, 1.0);

    vTextureCoords = uv;
    vColorTint = aColorTint;
    vColorMul = aColorMul;
    vColorAdd = aColorAdd;
    vMode = aMode;
}
`,
  {
    aVertex: { type: "float", components: 4 },
    aColorMul: { type: "float", components: 4 },
    aColorAdd: { type: "float", components: 4 },
    aColorTint: { type: "byte", components: 4, normalized: true },
    aMode: { type: "byte", components: 1 },
  },
  {
    uProjectionMatrix: "mat3",
    uDepth: "float",
  }
);

const fragSprite = Shader.fragment(
  `
precision highp float;

varying vec2 vTextureCoords;
varying vec4 vColorTint;
varying vec4 vColorMul;
varying vec4 vColorAdd;
varying float vMode;

uniform sampler2D uTex[8];

void main(void) {
    vec4 tex;
    int texId = int(mod(vMode, 8.0));
    int fillMode = int(vMode) / 8;

    vec2 coords;
    if (fillMode == 1) {
        coords = vec2(vTextureCoords.x, 0.0);
    } else if (fillMode == 2) {
        coords = vec2(length(vTextureCoords * 2.0 - 1.0), 0.0);
    } else {
        coords = vTextureCoords;
    }

    for (int i = 0; i < 8; i++) {
        vec4 c = texture2D(uTex[i], coords);
        if (i == texId) {
            tex = c;
        }
    }

    gl_FragColor = (tex * vColorTint * vec4(vColorMul.rgb, 1.0) + vColorAdd * tex.a) * vColorMul.a;
}
`,
  {
    uTex: "intlist",
  }
);

export const programSprite = new Program(vertSprite, fragSprite);
