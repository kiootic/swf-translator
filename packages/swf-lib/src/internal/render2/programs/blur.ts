export const renderVertexShader = `
#version 300 es

layout(location=0) in vec4 aVertex;

out vec2 vTextureCoords;
out vec2 vDelta;

void main(void) {
    gl_Position = vec4(aVertex.xy, 0.0, 1.0);

    vTextureCoords = aVertex.xy;
    vDelta = aVertex.zw;
}
`;

export const renderFragmentShader = `
#version 300 es
precision highp float;

in vec2 vTextureCoords;
in vec2 vDelta;

uniform sampler2D uTexture;

void main(void) {
  gl_FragColor = vec4(0.0);
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta * -8.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta * -7.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta * -6.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta * -5.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta * -4.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta * -3.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta * -2.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta * -1.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta       ) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta *  1.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta *  2.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta *  3.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta *  4.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta *  5.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta *  6.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta *  7.0) * 0.058823529411764705;
  gl_FragColor += texture(uTexture, vTextureCoords + vDelta *  8.0) * 0.058823529411764705;
}
`;
