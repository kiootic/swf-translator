import { MorphShape } from "../../classes/flash/display/MorphShape";
import type { AssetLibrary } from "../../classes/__internal/AssetLibrary";
import { MorphShapeCharacter } from "../../classes/__internal/character/MorphShape";
import { CharacterInstance } from "./CharacterInstance";
import { makeShapeRenderObject } from "./shapes";
import { RenderObject } from "../render2/RenderObject";
import { rect } from "../math/rect";

interface MorphShapeFrame {
  renderObjects: RenderObject[];
  bounds: rect;
}

export class MorphShapeInstance implements CharacterInstance {
  readonly frames = new Map<number, MorphShapeFrame>();

  constructor(
    readonly id: number,
    def: MorphShapeCharacter,
    lib: AssetLibrary
  ) {
    for (const [ratio, shape] of def.frames) {
      const renderObjects = shape.contours.map((c) =>
        makeShapeRenderObject(c, lib)
      );
      const bounds = rect.create();
      for (const def of renderObjects) {
        rect.union(bounds, bounds, def.bounds);
      }
      this.frames.set(ratio, { renderObjects, bounds });
    }
  }

  applyTo(container: MorphShape) {
    const frame = this.frames.get(container.__ratio);
    if (!frame) {
      console.warn(
        `no ratio frame #${container.__ratio} for morph shape #${this.id}`
      );
      return;
    }

    container.__node.setRenderObjects(frame.renderObjects, frame.bounds);
  }
}
