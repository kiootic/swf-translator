import { CharacterInstance } from "./CharacterInstance";
import { Font } from "../../classes/_internal/character";
import type { AssetLibrary } from "../../classes/_internal";
import { makeMesh, MeshDef } from "./shapes";

export class FontInstance implements CharacterInstance {
  readonly glyphMeshes: MeshDef[][];

  constructor(readonly id: number, readonly font: Font, lib: AssetLibrary) {
    this.glyphMeshes = font.glyphs.map((glyph) =>
      glyph.shape.contours.map((c) => makeMesh(c, lib))
    );
  }
}
