import {
  Matrix,
  Buffer,
  Texture,
  Program,
  Geometry,
  TYPES,
  MeshMaterial,
} from "pixi.js";
import type { AssetLibrary } from "../../classes/_internal/AssetLibrary";
import { ShapeContour } from "../../classes/_internal/character/Shape";
import { FillStyleKind } from "../../classes/_internal/character/styles";
import { shaderColor, shaderGradient } from "./shaders";
import { makeGradientTexture } from "./gradient";

export class ShapeGeometry extends Geometry {
  constructor(vertices: Buffer, indices: Buffer) {
    super();

    this.addAttribute(
      "aVertexPosition",
      vertices,
      2,
      false,
      TYPES.FLOAT
    ).addIndex(indices);
  }
}

export class ShapeMaterial extends MeshMaterial {
  #color: number;
  #uniforms: unknown;

  constructor(
    texture: Texture,
    program: Program,
    color: number,
    uniforms: unknown
  ) {
    super(texture, { program });

    super.tint = color & 0xffffff;
    super.alpha = (color >>> 24) / 255;
    this.#color = color;
    this.#uniforms = uniforms;
    Object.assign(this.uniforms, this.#uniforms);
  }

  clone(color?: number, uniforms?: unknown) {
    return new ShapeMaterial(
      this.texture,
      this.program,
      color ?? this.#color,
      uniforms ?? Object.assign({}, this.#uniforms)
    );
  }

  get tint(): number {
    return super.tint;
  }
  set tint(_: number) {}

  get alpha(): number {
    return super.alpha;
  }
  set alpha(_: number) {}

  update() {
    super.update();
    Object.assign(this.uniforms, this.#uniforms);
  }
}

export interface MeshDef {
  geometry: ShapeGeometry;
  shader: ShapeMaterial;
}

export function makeMesh(contour: ShapeContour, lib: AssetLibrary): MeshDef {
  const vertices = new Buffer(Float32Array.from(contour.vertices), true);
  const indices = new Buffer(Uint16Array.from(contour.indices), true);

  let texture = Texture.WHITE;
  let program = shaderColor;
  let color = 0xffffffff;
  let uniforms: unknown = {};
  switch (contour.fill.kind) {
    case FillStyleKind.SolidColor: {
      color = contour.fill.color;
      break;
    }

    case FillStyleKind.LinearGradient:
    case FillStyleKind.RadicalGradient: {
      texture = makeGradientTexture(contour.fill.gradient, contour.fill.matrix);
      program = shaderGradient;

      const mat = new Matrix();
      mat.fromArray(contour.fill.matrix);
      convertMatrix(mat, 32768, 32768, 0.5);

      uniforms = { uGradientType: contour.fill.kind, uTextureMatrix: mat };
      break;
    }

    case FillStyleKind.ClippedBitmap: {
      texture = lib.resolveImage(contour.fill.characterId);

      const mat = new Matrix();
      mat.fromArray(contour.fill.matrix);
      convertMatrix(mat, texture.width, texture.height, 0);

      uniforms = { uTextureMatrix: mat };
      break;
    }
  }

  const geometry = new ShapeGeometry(vertices, indices);
  const shader = new ShapeMaterial(texture, program, color, uniforms);

  return { geometry, shader };
}

// https://github.com/ruffle-rs/ruffle/blob/09ca11f788ef5c5efa45a40d96e3cbe5be9e940b/render/common_tess/src/lib.rs#L344
function convertMatrix(
  mat: Matrix,
  width: number,
  height: number,
  offset: number
) {
  mat.invert();
  mat.scale(1 / width, 1 / height);
  mat.translate(offset, offset);
}
