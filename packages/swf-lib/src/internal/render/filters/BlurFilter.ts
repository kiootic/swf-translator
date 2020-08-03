import { Filter, FilterContext } from "../Filter";
import { programBlur } from "../shaders";
import { vec2 } from "gl-matrix";

export class BlurFilter implements Filter {
  blurX = 0;
  blurY = 0;
  passes = 3;

  get padX() {
    return this.blurX * 2;
  }
  get padY() {
    return this.blurY * 2;
  }

  apply(ctx: FilterContext): void {
    const radiusX = this.blurX / 2;
    const radiusY = this.blurY / 2;
    const uDeltaX = vec2.fromValues(radiusX / 8 / ctx.width, 0);
    const uDeltaY = vec2.fromValues(0, radiusY / 8 / ctx.height);

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

    ctx.blit(from, ctx.target.texture);
  }
}
