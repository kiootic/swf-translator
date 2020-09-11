import { Filter, FilterInput, FilterInstance } from "./Filter";
import { Renderer } from "../Renderer";
import { TextureTarget } from "../gl/targets";
import { Texture } from "../gl/Texture";
import { attrs, programBlur, vertexArray } from "./programs";
import { mat2d, vec2 } from "gl-matrix";
import { projection } from "../../math/matrix";

export interface DropShadowFilterInstance extends FilterInstance {
  blurX: number;
  blurY: number;
  passes: number;
  color: number;
  strength: number;
  angle: number;
  distance: number;
  knockout: boolean;
}

const outProjection = mat2d.create();
const inTexScale = vec2.create();
const outTexScale = vec2.create();

export class DropShadowFilter implements Filter<DropShadowFilterInstance> {
  static readonly instance = new DropShadowFilter();

  apply(
    renderer: Renderer,
    input: FilterInput<DropShadowFilterInstance>[],
    out: TextureTarget
  ): void {
    const state = renderer.glState;
    const gl = state.gl;

    const { width, height } = out.texture;
    projection(outProjection, width, height, false);
    vec2.set(outTexScale, 1 / width, 1 / height);

    state.setViewport(0, 0, width, height);
    state.disable(gl.BLEND);
    state.setClearColor(0, 0, 0, 0);

    const texA = renderer.renderPool.takeTexture(width, height);
    const texB = renderer.renderPool.takeTexture(width, height);
    renderer.textureReturnBox.push(texA);
    renderer.textureReturnBox.push(texB);

    const batchInput: FilterInput<DropShadowFilterInstance>[] = [];
    let texture: Texture | null = null;
    let passes: number | null = null;
    const flush = () => {
      if (!texture || !passes) {
        return;
      }

      const numRect = batchInput.length;
      attrs.update(state, 0, numRect * 4 * 16);

      let front = texA;
      let back = texB;
      for (let i = 0; i < passes * 2; i++) {
        let passFront = front;
        let passBack = back.texture;
        let mode = i % 2;
        if (i === 0) {
          passBack = texture;
          mode += 2;
        } else if (i === passes * 2 - 1) {
          passFront = out;
        }

        passFront.framebuffer.ensure(state);
        state.bindFramebuffer(
          gl.FRAMEBUFFER,
          passFront.framebuffer.framebuffer
        );

        programBlur.ensure(state);
        vertexArray.ensure(state);
        passBack.ensure(state);

        state.useProgram(programBlur.program);
        const texUnit = state.bindTextures([passBack.texture])[0];
        programBlur.uniform(state, "uTexture", texUnit);
        programBlur.uniform(state, "uMode", mode);
        vertexArray.bind(state);
        gl.drawElements(gl.TRIANGLES, numRect * 6, gl.UNSIGNED_SHORT, 0);

        let tmp = back;
        back = front;
        front = tmp;
      }

      batchInput.length = 0;
      passes = null;
      texture = null;
    };

    for (const i of input) {
      if (i.texture !== texture || i.instance.passes !== passes) {
        flush();
        texture = i.texture;
        passes = i.instance.passes;
        vec2.set(inTexScale, 1 / texture.width, 1 / texture.height);
      }

      const radiusX = i.instance.blurX / 2;
      const radiusY = i.instance.blurY / 2;
      const deltaX = radiusX / 17;
      const deltaY = radiusY / 17;
      let attrI = batchInput.length * 4 * 16;

      for (let j = 0; j < 4; j++) {
        attrs.data[attrI + 0] = deltaX;
        attrs.data[attrI + 1] = deltaY;
        switch (j) {
          case 0:
            attrs.data[attrI + 2] = i.outBounds[0] + i.outBounds[2];
            attrs.data[attrI + 3] = i.outBounds[1];
            attrs.data[attrI + 4] = i.inBounds[0] + i.inBounds[2];
            attrs.data[attrI + 5] = i.inBounds[1];
            attrs.data[attrI + 6] = i.outBounds[0] + i.outBounds[2];
            attrs.data[attrI + 7] = i.outBounds[1];
            break;
          case 1:
            attrs.data[attrI + 2] = i.outBounds[0];
            attrs.data[attrI + 3] = i.outBounds[1] + i.outBounds[3];
            attrs.data[attrI + 4] = i.inBounds[0];
            attrs.data[attrI + 5] = i.inBounds[1] + i.inBounds[3];
            attrs.data[attrI + 6] = i.outBounds[0];
            attrs.data[attrI + 7] = i.outBounds[1] + i.outBounds[3];
            break;
          case 2:
            attrs.data[attrI + 2] = i.outBounds[0];
            attrs.data[attrI + 3] = i.outBounds[1];
            attrs.data[attrI + 4] = i.inBounds[0];
            attrs.data[attrI + 5] = i.inBounds[1];
            attrs.data[attrI + 6] = i.outBounds[0];
            attrs.data[attrI + 7] = i.outBounds[1];
            break;
          case 3:
            attrs.data[attrI + 2] = i.outBounds[0] + i.outBounds[2];
            attrs.data[attrI + 3] = i.outBounds[1] + i.outBounds[3];
            attrs.data[attrI + 4] = i.inBounds[0] + i.inBounds[2];
            attrs.data[attrI + 5] = i.inBounds[1] + i.inBounds[3];
            attrs.data[attrI + 6] = i.outBounds[0] + i.outBounds[2];
            attrs.data[attrI + 7] = i.outBounds[1] + i.outBounds[3];
            break;
        }

        attrs.data[attrI + 8] = i.inBounds[0] + 0.5;
        attrs.data[attrI + 9] = i.inBounds[1] + 0.5;
        attrs.data[attrI + 10] = i.inBounds[0] + i.inBounds[2] - 1.5;
        attrs.data[attrI + 11] = i.inBounds[1] + i.inBounds[3] - 1.5;

        attrs.data[attrI + 12] = i.outBounds[0] + 0.5;
        attrs.data[attrI + 13] = i.outBounds[1] + 0.5;
        attrs.data[attrI + 14] = i.outBounds[0] + i.outBounds[2] - 1.5;
        attrs.data[attrI + 15] = i.outBounds[1] + i.outBounds[3] - 1.5;

        const delta = attrs.data.subarray(attrI + 0, attrI + 2);
        const vertex = attrs.data.subarray(attrI + 2, attrI + 4);
        const inTexCoords = attrs.data.subarray(attrI + 4, attrI + 6);
        const outTexCoords = attrs.data.subarray(attrI + 6, attrI + 8);
        const inBoundsMin = attrs.data.subarray(attrI + 8, attrI + 10);
        const inBoundsMax = attrs.data.subarray(attrI + 10, attrI + 12);
        const outBoundsMin = attrs.data.subarray(attrI + 12, attrI + 14);
        const outBoundsMax = attrs.data.subarray(attrI + 14, attrI + 16);

        vec2.mul(delta, delta, inTexScale);
        vec2.transformMat2d(vertex, vertex, outProjection);
        vec2.mul(inTexCoords, inTexCoords, inTexScale);
        vec2.mul(inBoundsMin, inBoundsMin, inTexScale);
        vec2.mul(inBoundsMax, inBoundsMax, inTexScale);
        vec2.mul(outTexCoords, outTexCoords, outTexScale);
        vec2.mul(outBoundsMin, outBoundsMin, outTexScale);
        vec2.mul(outBoundsMax, outBoundsMax, outTexScale);

        attrI += 16;
      }

      batchInput.push(i);
    }
    flush();
  }
}
