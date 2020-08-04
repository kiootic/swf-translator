import { Filter, FilterContext } from "../Filter";
import { programBlur, programDropShadow } from "../shaders";
import { vec2, vec4 } from "gl-matrix";
import { preMultiplyAlpha } from "../../math/color";

export class DropShadowFilter implements Filter {
  color = 0xffffffff;
  blurX = 0;
  blurY = 0;
  passes = 3;
  strength = 1;
  angle = 45;
  distance = 4;

  get padX() {
    return this.blurX * 2;
  }
  get padY() {
    return this.blurY * 2;
  }

  apply(ctx: FilterContext): void {
    if (this.strength === 0) {
      return;
    }

    const radiusX = this.blurX / 2;
    const radiusY = this.blurY / 2;
    const uDeltaX = vec2.fromValues(radiusX / 8 / ctx.width, 0);
    const uDeltaY = vec2.fromValues(0, radiusY / 8 / ctx.height);
    const color = preMultiplyAlpha(vec4.create(), this.color);
    vec4.scale(color, color, this.strength);
    const offset = vec2.fromValues(this.distance, 0);
    vec2.rotate(offset, offset, [0, 0], (this.angle * Math.PI) / 180);
    vec2.mul(offset, offset, [1 / ctx.width, 1 / ctx.height]);

    let from = ctx.target.textureAux1;
    let to = ctx.target.textureAux2;

    for (let i = 0; i < this.passes; i++) {
      ctx.applyFilter(
        programBlur,
        { from: i === 0 ? ctx.target.texture : from, to },
        (gl) => {
          programBlur.setUniform(gl, "uDelta", uDeltaX);
        }
      );

      const t = from;
      from = to;
      to = t;
    }

    for (let i = 0; i < this.passes; i++) {
      ctx.applyFilter(programBlur, { from, to }, (gl) => {
        programBlur.setUniform(gl, "uDelta", uDeltaY);
      });

      const t = from;
      from = to;
      to = t;
    }

    ctx.applyFilter(
      programDropShadow,
      { from, to: ctx.target.texture, clearBuffer: false },
      (gl) => {
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE_MINUS_DST_ALPHA, gl.ONE);
        programDropShadow.setUniform(gl, "uOffset", offset);
        programDropShadow.setUniform(gl, "uColor", color);
      }
    );
  }
}
