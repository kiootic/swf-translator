export const blurVertexShader = `
#version 300 es

layout(location=0) in vec4 aVertex;
layout(location=1) in vec4 aTexCoords;
layout(location=2) in vec4 aBoundsIn;
layout(location=3) in vec4 aBoundsOut;

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

export const blurFragmentShader = `
#version 300 es
precision highp float;

in vec2 vTextureCoords;
in vec2 vDelta;
in vec4 vBounds;

uniform sampler2D uTexture;

out vec4 fragColor;

vec4 sampleTex(float offset) {
  vec2 coords = clamp(vTextureCoords + vDelta * offset, vBounds.xy, vBounds.zw);
  return texture(uTexture, coords);
}

void main(void) {
  fragColor = vec4(0.0);
  fragColor += sampleTex(-8.0) * 0.058823529411764705;
  fragColor += sampleTex(-7.0) * 0.058823529411764705;
  fragColor += sampleTex(-6.0) * 0.058823529411764705;
  fragColor += sampleTex(-5.0) * 0.058823529411764705;
  fragColor += sampleTex(-4.0) * 0.058823529411764705;
  fragColor += sampleTex(-3.0) * 0.058823529411764705;
  fragColor += sampleTex(-2.0) * 0.058823529411764705;
  fragColor += sampleTex(-1.0) * 0.058823529411764705;
  fragColor += sampleTex( 0.0) * 0.058823529411764705;
  fragColor += sampleTex(+1.0) * 0.058823529411764705;
  fragColor += sampleTex(+2.0) * 0.058823529411764705;
  fragColor += sampleTex(+3.0) * 0.058823529411764705;
  fragColor += sampleTex(+4.0) * 0.058823529411764705;
  fragColor += sampleTex(+5.0) * 0.058823529411764705;
  fragColor += sampleTex(+6.0) * 0.058823529411764705;
  fragColor += sampleTex(+7.0) * 0.058823529411764705;
  fragColor += sampleTex(+8.0) * 0.058823529411764705;
}
`;
