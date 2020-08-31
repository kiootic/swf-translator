import { MorphShape } from "../../classes/flash/display/MorphShape";
import type { AssetLibrary } from "../../classes/__internal/AssetLibrary";
import { MorphShapeCharacter } from "../../classes/__internal/character/MorphShape";
import { CharacterInstance } from "./CharacterInstance";
import { makeShapeRenderObject } from "./shapes";
import {
  SpriteDef,
  RenderObjectSprite,
} from "../render/objects/RenderObjectSprite";
import { rect } from "../math/rect";

interface MorphShapeFrame {
  sprites: SpriteDef[];
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
      const sprites = shape.contours.map((c) => makeShapeRenderObject(c, lib));
      const bounds = rect.create();
      for (const def of sprites) {
        rect.union(bounds, bounds, def.bounds);
      }
      this.frames.set(ratio, { sprites, bounds });
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

    const objects: RenderObjectSprite[] = [];
    for (const s of frame.sprites) {
      objects.push(new RenderObjectSprite(s));
    }
    container.__node.setRenderObjects(objects, frame.bounds);
  }
}
