export const shadowVertexShader = `
#version 300 es

layout(location=0) in vec4 aVertex;
layout(location=1) in vec4 aTexCoords;
layout(location=2) in vec4 aColor;
layout(location=3) in vec4 aBounds;
layout(location=4) in uint aMode;

out vec2 vInTexCoords;
out vec2 vOutTexCoords;
out vec2 vDelta;
out vec4 vBounds;
out vec4 vColor;
flat out uint vMode;

void main(void) {
    gl_Position = vec4(aVertex.zw, 0.0, 1.0);

    vInTexCoords = aTexCoords.xy;
    vOutTexCoords = aTexCoords.zw;
    vDelta = aVertex.xy;
    vBounds = aBounds;
    vColor = aColor;
    vMode = aMode;
}
`;

export const shadowFragmentShader = `
#version 300 es
precision highp float;

in vec2 vInTexCoords;
in vec2 vOutTexCoords;
in vec2 vDelta;
in vec4 vBounds;
in vec4 vColor;
flat in uint vMode;

uniform sampler2D uTextures[2];

out vec4 fragColor;

void main(void) {
  vec2 shadowCoords = clamp(vOutTexCoords - vDelta, vBounds.xy, vBounds.zw);
  vec4 shadow = vColor * texture(uTextures[0], shadowCoords).a;
  vec4 color = texture(uTextures[1], vInTexCoords);
  if (int(vMode) % 2 != 0) {
    fragColor = shadow * (1.0 - color.a);
  } else {
    fragColor = shadow * (1.0 - color.a) + color;
  }
}
`;
