import { vec2 } from "gl-matrix";

export class Canvas {
  readonly container = document.createElement("div");
  readonly element = document.createElement("canvas");
  private __cursor = "";

  constructor(readonly width: number, readonly height: number) {
    this.container.style.setProperty("width", `${width}px`);
    this.container.style.setProperty("height", `${height}px`);
    this.container.style.setProperty("position", "relative");

    this.element.tabIndex = 0;
    this.element.style.setProperty("outline", "none", "important");
    this.element.style.setProperty("user-select", "none", "important");
    this.element.style.setProperty("position", "absolute");
    this.element.style.setProperty("width", `${width}px`);
    this.element.style.setProperty("height", `${height}px`);
    this.element.width = width * window.devicePixelRatio;
    this.element.height = height * window.devicePixelRatio;

    this.container.appendChild(this.element);
  }

  get cursor(): string {
    return this.__cursor;
  }

  set cursor(value: string) {
    if (value !== this.__cursor) {
      this.element.style.cursor = value;
      this.__cursor = value;
    }
  }

  resolveCoords(out: vec2, clientX: number, clientY: number) {
    const rect = this.element.getBoundingClientRect();
    out[0] = clientX - rect.left;
    out[1] = clientY - rect.top;
  }
}
