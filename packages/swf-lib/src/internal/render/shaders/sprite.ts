import { Shader } from "../Shader";

export const fragSprite = Shader.fragment(
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
