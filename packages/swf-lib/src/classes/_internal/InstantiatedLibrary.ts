import { ShapeInstance } from "../../internal/character/ShapeInstance";
import { Shape } from "../flash/display/Shape";

export class InstantiatedLibrary {
  constructor(private readonly shapes: Map<number, ShapeInstance>) {}

  resolveShape(id: number, shape: Shape) {
    const instance = this.shapes.get(id);
    if (!instance) {
      throw new Error(`Shape character #${id} not found`);
    }

    instance.applyTo(shape.__pixi);
    return shape;
  }
}
