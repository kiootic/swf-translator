export class Canvas {
  readonly canvas = document.createElement("canvas");

  get width(): number {
    return this.canvas.width;
  }
  set width(value: number) {
    this.canvas.width = value;
  }

  get height(): number {
    return this.canvas.height;
  }
  set height(value: number) {
    this.canvas.height = value;
  }

  getContext(): WebGL2RenderingContext {
    const ctx = this.canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
      premultipliedAlpha: false,
      stencil: true,
    });
    if (!ctx) {
      throw new Error("Cannot create context");
    }
    return ctx;
  }
}
