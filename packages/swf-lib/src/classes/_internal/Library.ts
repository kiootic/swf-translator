import { Image } from "./character/Image";
import { Shape } from "./character/Shape";

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
