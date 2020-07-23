import { Mesh, Container } from "pixi.js";
import type { AssetLibrary } from "../../classes/_internal/AssetLibrary";
import { Shape } from "../../classes/_internal/character/Shape";
import { CharacterInstance } from "./CharacterInstance";
import { makeMesh, MeshDef } from "./shapes";

export class ShapeInstance implements CharacterInstance {
  readonly meshes: MeshDef[];

  constructor(readonly id: number, def: Shape, lib: AssetLibrary) {
    this.meshes = def.contours.map((c) => makeMesh(c, lib));
  }

  applyTo(container: Container) {
    container.removeChildren();
    for (const m of this.meshes) {
      const mesh = new Mesh(m.geometry, m.shader);
      container.addChild(mesh);
    }
  }
}
