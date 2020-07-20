import { Program } from "pixi.js";

const shapeVert = `
attribute vec2 aVertexPosition;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTextureMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = (uTextureMatrix * vec3(aVertexPosition, 1.0)).xy;
}
`;

const colorFrag = `
varying vec2 vTextureCoord;
uniform vec4 uColor;

uniform sampler2D uSampler;

void main(void)
{
    gl_FragColor = texture2D(uSampler, vTextureCoord) * uColor;
}
`;

const gradientFrag = `
varying vec2 vTextureCoord;
uniform vec4 uColor;

uniform sampler2D uSampler;
uniform int uGradientType;

void main(void)
{
    float t = 0.0;
    if (uGradientType == 2) {
        t = length(vTextureCoord * 2.0 - 1.0);
    } else {
        t = vTextureCoord.x;
    }
    gl_FragColor = texture2D(uSampler, vec2(t, 0)) * uColor;
}
`;

export const shaderColor = new Program(shapeVert, colorFrag);
export const shaderGradient = new Program(shapeVert, gradientFrag);
