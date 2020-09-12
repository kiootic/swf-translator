import { mat2d, vec2, vec4 } from "gl-matrix";
import { Filter, FilterInput, FilterInstance } from "./Filter";
import { Renderer } from "../Renderer";
import { TextureTarget } from "../gl/targets";
import { Texture } from "../gl/Texture";
import {
  attrs,
  attrFloat,
  attrUint,
  programBlur,
  vertexArray,
  programShadow,
} from "./programs";
import { projection } from "../../math/matrix";
import { preMultiplyAlpha, decomposeColorVec } from "../../math/color";

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

  isEffective(instance: DropShadowFilterInstance): boolean {
    return instance.blurX > 0 || instance.blurY > 0 || instance.distance > 0;
  }

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
    let radius = 0;
    let texture: Texture | null = null;
    let passes: number | null = null;
    const flush = () => {
      if (!texture || !passes) {
        return;
      }

      const blurProgram = programBlur(radius);

      const numRect = batchInput.length;
      attrs.update(state, 0, numRect * 4 * 17);

      let front = texA;
      let back = texB;
      for (let i = 0; i < passes * 2; i++) {
        let passFront = front;
        let passBack = back.texture;
        let mode = i % 2;
        if (i === 0) {
          passBack = texture;
          mode += 2;
        }

        passFront.framebuffer.ensure(state);
        state.bindFramebuffer(
          gl.FRAMEBUFFER,
          passFront.framebuffer.framebuffer
        );

        blurProgram.ensure(state);
        vertexArray.ensure(state);
        passBack.ensure(state);

        state.useProgram(blurProgram.program);
        const texUnit = state.bindTextures([passBack.texture])[0];
        blurProgram.uniform(state, "uTexture", texUnit);
        blurProgram.uniform(state, "uMode", mode);
        vertexArray.bind(state);
        gl.drawElements(gl.TRIANGLES, numRect * 6, gl.UNSIGNED_SHORT, 0);

        let tmp = back;
        back = front;
        front = tmp;
      }

      for (let i = 0; i < batchInput.length; i++) {
        const color = decomposeColorVec(
          vec4.create(),
          preMultiplyAlpha(batchInput[i].instance.color)
        );
        vec4.scale(color, color, batchInput[i].instance.strength);
        const delta = vec2.fromValues(batchInput[i].instance.distance, 0);
        vec2.rotate(delta, delta, [0, 0], batchInput[i].instance.angle);
        vec2.mul(delta, delta, outTexScale);
        let mode = 0;
        if (batchInput[i].instance.knockout) {
          mode |= 1;
        }
        for (let j = 0; j < 4; j++) {
          const attrI = (i * 4 + j) * 17;
          attrFloat[attrI + 0] = delta[0];
          attrFloat[attrI + 1] = delta[1];

          attrFloat[attrI + 8] = color[0];
          attrFloat[attrI + 9] = color[1];
          attrFloat[attrI + 10] = color[2];
          attrFloat[attrI + 11] = color[3];

          attrUint[attrI + 16] = mode;
        }
      }
      attrs.update(state, 0, numRect * 4 * 17);

      out.framebuffer.ensure(state);
      state.bindFramebuffer(gl.FRAMEBUFFER, out.framebuffer.framebuffer);

      programShadow.ensure(state);
      state.useProgram(programShadow.program);
      const texUnits = state.bindTextures([
        back.texture.texture,
        texture.texture,
      ]);
      programShadow.uniform(state, "uTextures[0]", texUnits);
      gl.drawElements(gl.TRIANGLES, numRect * 6, gl.UNSIGNED_SHORT, 0);

      batchInput.length = 0;
      passes = null;
      texture = null;
    };

    for (const i of input) {
      if (i.texture !== texture || i.instance.passes !== passes) {
        flush();
        texture = i.texture;
        passes = i.instance.passes;
        radius = 0;
        vec2.set(inTexScale, 1 / texture.width, 1 / texture.height);
      }

      const deltaX = i.instance.blurX / 2;
      const deltaY = i.instance.blurY / 2;
      radius = Math.max(radius, deltaX, deltaY);

      let attrI = batchInput.length * 4 * 17;
      for (let j = 0; j < 4; j++) {
        attrFloat[attrI + 0] = deltaX;
        attrFloat[attrI + 1] = deltaY;
        switch (j) {
          case 0:
            attrFloat[attrI + 2] = i.outBounds[0] + i.outBounds[2];
            attrFloat[attrI + 3] = i.outBounds[1];
            attrFloat[attrI + 4] = i.inBounds[0] + i.inBounds[2];
            attrFloat[attrI + 5] = i.inBounds[1];
            attrFloat[attrI + 6] = i.outBounds[0] + i.outBounds[2];
            attrFloat[attrI + 7] = i.outBounds[1];
            break;
          case 1:
            attrFloat[attrI + 2] = i.outBounds[0];
            attrFloat[attrI + 3] = i.outBounds[1] + i.outBounds[3];
            attrFloat[attrI + 4] = i.inBounds[0];
            attrFloat[attrI + 5] = i.inBounds[1] + i.inBounds[3];
            attrFloat[attrI + 6] = i.outBounds[0];
            attrFloat[attrI + 7] = i.outBounds[1] + i.outBounds[3];
            break;
          case 2:
            attrFloat[attrI + 2] = i.outBounds[0];
            attrFloat[attrI + 3] = i.outBounds[1];
            attrFloat[attrI + 4] = i.inBounds[0];
            attrFloat[attrI + 5] = i.inBounds[1];
            attrFloat[attrI + 6] = i.outBounds[0];
            attrFloat[attrI + 7] = i.outBounds[1];
            break;
          case 3:
            attrFloat[attrI + 2] = i.outBounds[0] + i.outBounds[2];
            attrFloat[attrI + 3] = i.outBounds[1] + i.outBounds[3];
            attrFloat[attrI + 4] = i.inBounds[0] + i.inBounds[2];
            attrFloat[attrI + 5] = i.inBounds[1] + i.inBounds[3];
            attrFloat[attrI + 6] = i.outBounds[0] + i.outBounds[2];
            attrFloat[attrI + 7] = i.outBounds[1] + i.outBounds[3];
            break;
        }

        attrFloat[attrI + 8] = i.inBounds[0] + 0.5;
        attrFloat[attrI + 9] = i.inBounds[1] + 0.5;
        attrFloat[attrI + 10] = i.inBounds[0] + i.inBounds[2] - 1.5;
        attrFloat[attrI + 11] = i.inBounds[1] + i.inBounds[3] - 1.5;

        attrFloat[attrI + 12] = i.outBounds[0] + 0.5;
        attrFloat[attrI + 13] = i.outBounds[1] + 0.5;
        attrFloat[attrI + 14] = i.outBounds[0] + i.outBounds[2] - 1.5;
        attrFloat[attrI + 15] = i.outBounds[1] + i.outBounds[3] - 1.5;

        const delta = attrFloat.subarray(attrI + 0, attrI + 2);
        const vertex = attrFloat.subarray(attrI + 2, attrI + 4);
        const inTexCoords = attrFloat.subarray(attrI + 4, attrI + 6);
        const outTexCoords = attrFloat.subarray(attrI + 6, attrI + 8);
        const inBoundsMin = attrFloat.subarray(attrI + 8, attrI + 10);
        const inBoundsMax = attrFloat.subarray(attrI + 10, attrI + 12);
        const outBoundsMin = attrFloat.subarray(attrI + 12, attrI + 14);
        const outBoundsMax = attrFloat.subarray(attrI + 14, attrI + 16);

        vec2.mul(delta, delta, inTexScale);
        vec2.transformMat2d(vertex, vertex, outProjection);
        vec2.mul(inTexCoords, inTexCoords, inTexScale);
        vec2.mul(inBoundsMin, inBoundsMin, inTexScale);
        vec2.mul(inBoundsMax, inBoundsMax, inTexScale);
        vec2.mul(outTexCoords, outTexCoords, outTexScale);
        vec2.mul(outBoundsMin, outBoundsMin, outTexScale);
        vec2.mul(outBoundsMax, outBoundsMax, outTexScale);

        attrI += 17;
      }

      batchInput.push(i);
    }
    flush();
  }
}
