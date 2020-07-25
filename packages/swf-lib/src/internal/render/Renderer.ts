import { mat3 } from "gl-matrix";
import { Canvas } from "./Canvas";
import { RenderContext } from "./RenderContext";
import { Screen } from "./Screen";
import { RenderObjectProgram, RenderObject } from "./RenderObject";
import { rect } from "../math/rect";

export class Renderer {
  gl: WebGL2RenderingContext;
  constructor(readonly canvas: Canvas) {
    this.gl = this.canvas.getContext();
  }

  backgroundColor = 0x000000;

  renderFrame(fn: (ctx: RenderContext) => void) {
    const ctx = new RenderContext(this);
    fn(ctx);

    const gl = this.gl;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);

    gl.clearColor(
      ((this.backgroundColor >>> 16) & 0xff) / 0xff,
      ((this.backgroundColor >>> 8) & 0xff) / 0xff,
      ((this.backgroundColor >>> 0) & 0xff) / 0xff,
      1
    );
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    const width = this.canvas.width,
      height = this.canvas.height;
    const projectionMat = mat3.projection(mat3.create(), width, height);
    mat3.scale(projectionMat, projectionMat, [1 / 20, 1 / 20]);
    const screen: Screen = {
      matrix: projectionMat,
      bounds: rect.fromValues(0, 0, width * 20, height * 20),
    };

    let program: RenderObjectProgram<RenderObject> | undefined;
    let begin = 0;
    for (let i = 0; i < ctx.objects.length; i++) {
      if (!program) {
        program = ctx.objects[i].program;
      }

      if (program !== ctx.objects[i].program) {
        program.render(gl, screen, ctx.objects.slice(begin, i));
        program = ctx.objects[i].program;
        begin = i;
      }
    }

    if (program) {
      program.render(gl, screen, ctx.objects.slice(begin));
    }

    gl.flush();
  }
}
