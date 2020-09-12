export const blurVertexShader = `
#version 300 es

layout(location=0) in vec4 aVertex;
layout(location=1) in vec4 aTexCoords;
layout(location=2) in vec4 aBoundsIn;
layout(location=3) in vec4 aBoundsOut;
layout(location=4) in uint x;

out vec2 vTextureCoords;
out vec2 vDelta;
out vec4 vBounds;

uniform uint uMode;

void main(void) {
    gl_Position = vec4(aVertex.zw, 0.0, 1.0);

    vec2 delta;
    vec2 texCoords;
    vec4 bounds;
    if (int(uMode) % 2 != 0) {
      delta = aVertex.xy * vec2(1.0, 0.0);
    } else {
      delta = aVertex.xy * vec2(0.0, 1.0);
    }
    if (int(uMode) / 2 != 0) {
      texCoords = aTexCoords.xy;
      bounds = aBoundsIn;
    } else {
      texCoords = aTexCoords.zw;
      bounds = aBoundsOut;
    }

    vTextureCoords = texCoords;
    vDelta = delta;
    vBounds = bounds;
}
`;

export const blurFragmentShader = (kernelWidth: number) => {
  const samples: number[] = [0];
  for (let i = 0; i < kernelWidth; i++) {
    const offset = i + 1;
    samples.push(offset / kernelWidth);
    samples.unshift(-offset / kernelWidth);
  }

  return `
#version 300 es
precision highp float;

in vec2 vTextureCoords;
in vec2 vDelta;
in vec4 vBounds;

uniform sampler2D uTexture;

out vec4 fragColor;

vec4 sampleTex(float offset) {
  vec2 coords = vTextureCoords + vDelta * offset;
  coords = clamp(coords, vBounds.xy, vBounds.zw);
  return texture(uTexture, coords);
}

void main(void) {
  fragColor = vec4(0.0);
  ${samples
    .map(
      (offset) =>
        `fragColor += sampleTex(${offset.toFixed(20)}) * ${1 / samples.length};`
    )
    .join("\n")}
}
`;
};
