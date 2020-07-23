import { Matrix as PIXIMatrix, Mesh, Container } from "pixi.js";
import { CharacterInstance } from "./CharacterInstance";
import { StaticText } from "../../classes/_internal/character";
import { MeshDef } from "./shapes";
import { AssetLibrary } from "../../classes/_internal";

interface GlyphMesh {
  matrix: PIXIMatrix;
  mesh: MeshDef;
}

export class StaticTextInstance implements CharacterInstance {
  readonly meshes: GlyphMesh[] = [];

  constructor(readonly id: number, text: StaticText, lib: AssetLibrary) {
    const matrix = new PIXIMatrix();
    matrix.fromArray(text.matrix);

    for (const glyph of text.glyphs) {
      const font = lib.resolveFont(glyph.fontId);
      const meshes = font.glyphMeshes[glyph.index];

      const glyphMatrix = new PIXIMatrix();
      glyphMatrix.scale(glyph.size / 1024 / 20, glyph.size / 1024 / 20);
      glyphMatrix.translate(glyph.x, glyph.y);
      glyphMatrix.prepend(matrix);

      for (const mesh of meshes) {
        const m: MeshDef = {
          geometry: mesh.geometry,
          shader: mesh.shader.clone(glyph.color),
        };
        this.meshes.push({ matrix: glyphMatrix, mesh: m });
      }
    }
  }

  applyTo(container: Container) {
    container.removeChildren();
    for (const m of this.meshes) {
      const mesh = new Mesh(m.mesh.geometry, m.mesh.shader);
      mesh.transform.setFromMatrix(m.matrix);
      container.addChild(mesh);
    }
  }
}
