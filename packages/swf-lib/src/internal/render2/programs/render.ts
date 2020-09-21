export const renderVertexShader = `
#version 300 es

layout(location=0) in vec4 aVertex;
layout(location=1) in vec4 aColor;
layout(location=2) in vec4 aColorMul;
layout(location=3) in vec4 aColorAdd;
layout(location=4) in uvec4 aMode;

out vec2 vTextureCoords;
out vec4 vColor;
out vec4 vColorMul;
out vec4 vColorAdd;
flat out uvec4 vMode;

void main(void) {
    vec2 pos = aVertex.xy;
    vec2 uv = aVertex.zw;
    gl_Position = vec4(pos, 0.0, 1.0);

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
flat in uvec4 vMode;
out vec4 fragColor;

uniform sampler2D uTextures[${maxTextures}];

vec4 sampleTex(int id, vec2 coords) {
  vec4 color;
  ${new Array(maxTextures)
    .fill(0)
    .map(
      (_, i) =>
        `
      if (id == ${i}) {
        color = texture(uTextures[${i}], coords);
      }
      `
    )
    .join("\n")}
  return color;
}

vec4 getTexel(int id, ivec2 coords) {
  vec4 color;
  ${new Array(maxTextures)
    .fill(0)
    .map(
      (_, i) =>
        `
      if (id == ${i}) {
        color = texelFetch(uTextures[${i}], coords, 0);
      }
      `
    )
    .join("\n")}
  return color;
}

void main(void) {
    int fillMode = int(vMode.x) % 4;
    int texId = int(vMode.x) / 4;
    int maskMode = int(vMode.y) % 4;
    int maskTexId = int(vMode.y) / 4;
    int maskID = int(vMode.z);

    vec2 coords;
    if (fillMode == 1) {
        coords = vec2(vTextureCoords.x, 0.0);
    } else if (fillMode == 2) {
        coords = vec2(length(vTextureCoords * 2.0 - 1.0), 0.0);
    } else {
        coords = vTextureCoords;
    }

    vec4 tex = sampleTex(texId, coords);
    vec4 color = (tex * vColor * vec4(vColorMul.rgb, 1.0)) * vColorMul.a;
    color += vColorAdd * color.a;

    if (maskMode == 1) {
      color = vec4(float(maskID) / 255.0, 0.0, 0.0, 1.0);
    } else if (maskMode == 2) {
      vec4 mask = getTexel(maskTexId, ivec2(gl_FragCoord.xy));
      if (maskID == int(mask.r * 255.0)) {
        color = color * mask.a;
      } else {
        color = vec4(0.0);
      }
    }

    color = trunc(color * 255.0) / 255.0;
    fragColor = color;
}
`;
