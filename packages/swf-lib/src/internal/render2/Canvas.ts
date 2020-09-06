import { vec2 } from "gl-matrix";

export class Canvas {
  readonly element = document.createElement("canvas");
  #cursor = "";

  constructor(readonly width: number, readonly height: number) {
    this.element.tabIndex = 0;
    this.element.style.setProperty("outline", "none", "important");
    this.element.width = width;
    this.element.height = height;
  }

  get cursor(): string {
    return this.#cursor;
  }

  set cursor(value: string) {
    if (value !== this.#cursor) {
      this.element.style.cursor = value;
      this.#cursor = value;
    }
  }

  resolveCoords(out: vec2, clientX: number, clientY: number) {
    const rect = this.element.getBoundingClientRect();
    out[0] = clientX - rect.left;
    out[1] = clientY - rect.top;
  }
}
