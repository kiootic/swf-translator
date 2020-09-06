export const renderVertexShader = `
#version 300 es

layout(location=0) in vec4 aVertex;
layout(location=1) in vec4 aColor;
layout(location=2) in vec4 aColorMul;
layout(location=3) in vec4 aColorAdd;
layout(location=4) in uint aMode;

uniform mat3 uProjectionMatrix;

out vec2 vTextureCoords;
out vec4 vColor;
out vec4 vColorMul;
out vec4 vColorAdd;
flat out uint vMode;

void main(void) {
    vec2 pos = aVertex.xy;
    vec2 uv = aVertex.zw;
    gl_Position = vec4((uProjectionMatrix * vec3(pos, 1.0)).xy, 0.0, 1.0);

    vTextureCoords = uv;
    vColor = aColor;
    vColorMul = aColorMul;
    vColorAdd = aColorAdd;
    vMode = aMode;
}
`;

export const renderFragmentShader = (maxTextures: number) => `
#version 300 es
precision highp float;

in vec2 vTextureCoords;
in vec4 vColor;
in vec4 vColorMul;
in vec4 vColorAdd;
flat in uint vMode;
out vec4 fragColor;

uniform sampler2D uTextures[${maxTextures}];

void main(void) {
    vec4 tex;
    int fillMode = int(vMode) % 4;
    int texId = int(vMode) / 4;

    vec2 coords;
    if (fillMode == 1) {
        coords = vec2(vTextureCoords.x, 0.0);
    } else if (fillMode == 2) {
        coords = vec2(length(vTextureCoords * 2.0 - 1.0), 0.0);
    } else {
        coords = vTextureCoords;
    }

    ${new Array(maxTextures)
      .fill(0)
      .map(
        (_, i) =>
          `
        if (texId == ${i}) {
          tex = texture(uTextures[${i}], coords);
        }
        `
      )
      .join("\n")}

    fragColor = (tex * vColor * vec4(vColorMul.rgb, 1.0) + vColorAdd * tex.a) * vColorMul.a;
}
`;
