import { Image } from "./character/Image";
import { Shape } from "./character/Shape";
import { InstantiatedLibrary } from "./InstantiatedLibrary";
import { ShapeInstance } from "../../internal/character/ShapeInstance";

export class Library {
  private readonly images = new Map<number, Image>();
  private readonly shapes = new Map<number, Shape>();

  registerImage(id: number, char: Image) {
    this.images.set(id, char);
  }

  registerShape(id: number, char: Shape) {
    this.shapes.set(id, char);
  }

  async instantiate(): Promise<InstantiatedLibrary> {
    const shapes = new Map<number, ShapeInstance>();
    for (const [id, shape] of this.shapes) {
      shapes.set(id, new ShapeInstance(shape));
    }

    return new InstantiatedLibrary(shapes);
  }
}
