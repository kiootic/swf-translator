import {
  Matrix,
  Buffer,
  Texture,
  Program,
  Geometry,
  TYPES,
  MeshMaterial,
  Mesh,
  Container,
} from "pixi.js";
import { Shape, ShapeContour } from "../../classes/_internal/character/Shape";
import { FillStyleKind } from "../../classes/_internal/character/styles";
import { shaderColor, shaderGradient } from "./shaders";
import { makeGradientTexture } from "./gradient";

class ShapeGeometry extends Geometry {
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

class ShapeMaterial extends MeshMaterial {
  private readonly _uniforms: unknown;

  constructor(
    texture: Texture,
    program: Program,
    color: number,
    uniforms: unknown
  ) {
    super(texture, { program });

    super.tint = color & 0xffffff;
    super.alpha = (color >>> 24) / 255;
    this._uniforms = uniforms;
    Object.assign(this.uniforms, this._uniforms);
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
    Object.assign(this.uniforms, this._uniforms);
  }
}

interface MeshDef {
  geometry: ShapeGeometry;
  shader: MeshMaterial;
}

function makeMesh(contour: ShapeContour): MeshDef {
  const vertices = new Buffer(Float32Array.from(contour.vertices), true);
  const indices = new Buffer(Uint16Array.from(contour.indices), true);

  let texture = Texture.WHITE;
  let program = shaderColor;
  let color = 0xffffffff;
  let uniforms: unknown = {};
  switch (contour.fill.kind) {
    case FillStyleKind.SolidColor:
      color = contour.fill.color;
      break;

    case FillStyleKind.LinearGradient:
    case FillStyleKind.RadicalGradient:
      texture = makeGradientTexture(contour.fill.gradient, contour.fill.matrix);
      program = shaderGradient;

      // https://github.com/ruffle-rs/ruffle/blob/09ca11f788ef5c5efa45a40d96e3cbe5be9e940b/render/common_tess/src/lib.rs#L344
      const mat = new Matrix();
      mat.fromArray(contour.fill.matrix);
      mat.invert();
      mat.scale(1 / 32768.0, 1 / 32768.0);
      mat.translate(0.5, 0.5);

      uniforms = { uGradientType: contour.fill.kind, uTextureMatrix: mat };
      break;
  }

  const geometry = new ShapeGeometry(vertices, indices);
  const shader = new ShapeMaterial(texture, program, color, uniforms);

  return { geometry, shader };
}

export class ShapeInstance {
  readonly meshes: MeshDef[];

  constructor(def: Shape) {
    this.meshes = def.contours.map((c) => makeMesh(c));
  }

  applyTo(container: Container) {
    container.removeChildren();
    for (const m of this.meshes) {
      const mesh = new Mesh(m.geometry, m.shader);
      container.addChild(mesh);
    }
  }
}
