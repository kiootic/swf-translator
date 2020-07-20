import { Image } from "./characters/Image";
import { Shape } from "./characters/Shape";

export class Library {
  private readonly images = new Map<number, Image>();
  private readonly shapes = new Map<number, Shape>();

  registerImage(id: number, char: Image) {
    this.images.set(id, char);
  }

  registerShape(id: number, char: Shape) {
    this.shapes.set(id, char);
  }
}
