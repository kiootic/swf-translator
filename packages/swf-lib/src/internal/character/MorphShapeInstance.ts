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
      this.frames.set(ratio, {
        sprites: shape.contours.map((c) => makeShapeRenderObject(c, lib)),
        bounds: rect.scale(rect.create(), shape.bounds, 1 / 20),
      });
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

    container.__renderObjects = [];
    for (const s of frame.sprites) {
      container.__renderObjects.push(new RenderObjectSprite(s));
    }
    rect.copy(container.__bounds.__rect, frame.bounds);
    container.__reportBoundsChanged();
    container.__dirtyRender = true;
  }
}
