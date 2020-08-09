import { Filter, FilterContext } from "../Filter";
import { programBlur } from "../shaders";
import { vec2 } from "gl-matrix";

export class BlurFilter implements Filter {
  blurX = 0;
  blurY = 0;
  passes = 3;

  get padX() {
    return this.blurX;
  }
  get padY() {
    return this.blurY;
  }

  apply(ctx: FilterContext): void {
    if (this.blurX === 0 && this.blurY === 0) {
      return;
    }

    const radiusX = this.blurX / 2;
    const radiusY = this.blurY / 2;
    const quality = Math.ceil(Math.max(radiusX, radiusY) / 16) * 4;
    const uDeltaX = vec2.fromValues(radiusX / 32 / ctx.width, 0);
    const uDeltaY = vec2.fromValues(0, radiusY / 32 / ctx.height);

    let from = ctx.target.textureAux1;
    let to = ctx.target.textureAux2;
    const blurProgram = programBlur(quality);

    if (this.blurX > 0) {
      for (let i = 0; i < this.passes; i++) {
        ctx.applyFilter(
          blurProgram,
          { from: i === 0 ? ctx.target.texture : from, to },
          (gl) => {
            blurProgram.setUniform(gl, "uDelta", uDeltaX);
          }
        );

        const t = from;
        from = to;
        to = t;
      }
    }

    if (this.blurY > 0) {
      for (let i = 0; i < this.passes; i++) {
        ctx.applyFilter(
          blurProgram,
          { from: i === 0 ? ctx.target.texture : from, to },
          (gl) => {
            blurProgram.setUniform(gl, "uDelta", uDeltaY);
          }
        );

        const t = from;
        from = to;
        to = t;
      }
    }

    ctx.blit(from, ctx.target.texture);
  }
}
