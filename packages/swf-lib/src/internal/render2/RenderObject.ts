import { rect } from "../math/rect";
import { mat2d, vec2 } from "gl-matrix";
import { sum } from "../math/funcs";
import { Texture } from "./gl/Texture";

interface RenderObjectMerge {
  renderObject: RenderObject;
  color?: number;
  transform: mat2d;
}

export class RenderObject {
  constructor(
    readonly vertices: Float32Array,
    readonly colors: Uint32Array,
    readonly indices: Uint16Array,
    readonly uvMatrix: mat2d,
    readonly texture: HTMLImageElement | HTMLCanvasElement | Texture | null,
    readonly fillMode: number,
    readonly bounds: rect
  ) {}

  static rect(bounds: rect, texture: Texture): RenderObject {
    const vertices = new Float32Array(8);
    vertices[0] = bounds[2];
    vertices[1] = 0;
    vertices[2] = 0;
    vertices[3] = bounds[3];
    vertices[4] = 0;
    vertices[5] = 0;
    vertices[6] = bounds[2];
    vertices[7] = bounds[3];

    const colors = new Uint32Array(4);
    colors.fill(0xffffffff);

    const indices = new Uint16Array(6);
    indices[0] = 0;
    indices[1] = 1;
    indices[2] = 2;
    indices[3] = 1;
    indices[4] = 0;
    indices[5] = 3;

    const uvMatrix = mat2d.fromScaling(mat2d.create(), [
      1 / texture.width,
      1 / texture.height,
    ]);
    mat2d.translate(uvMatrix, uvMatrix, [bounds[0], bounds[1]]);

    return new RenderObject(
      vertices,
      colors,
      indices,
      uvMatrix,
      texture,
      0,
      bounds
    );
  }

  hitTest(x: number, y: number, exact: boolean): boolean {
    if (!exact) {
      return rect.contains(this.bounds, x, y);
    }
    // https://stackoverflow.com/a/2049593
    const sign = (ax: number, ay: number, bx: number, by: number) => {
      return (x - bx) * (ay - by) - (ax - bx) * (y - by);
    };

    const vertices = this.vertices;
    const indices = this.indices;
    const numTriangles = indices.length / 3;
    for (let i = 0; i < numTriangles; i++) {
      const ax = vertices[indices[i * 3 + 0] * 2 + 0];
      const ay = vertices[indices[i * 3 + 0] * 2 + 1];
      const bx = vertices[indices[i * 3 + 1] * 2 + 0];
      const by = vertices[indices[i * 3 + 1] * 2 + 1];
      const cx = vertices[indices[i * 3 + 2] * 2 + 0];
      const cy = vertices[indices[i * 3 + 2] * 2 + 1];

      const d1 = sign(ax, ay, bx, by);
      const d2 = sign(bx, by, cx, cy);
      const d3 = sign(cx, cy, ax, ay);

      const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
      const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;
      if (!hasNegative || !hasPositive) {
        return true;
      }
    }
    return false;
  }

  static merge(input: RenderObjectMerge[]): RenderObject[] {
    let numVertex = 0;
    let numIndex = 0;
    const subInput: RenderObjectMerge[] = [];
    const result: RenderObject[] = [];

    for (const i of input) {
      if (numIndex + i.renderObject.indices.length >= 0x10000) {
        result.push(doMerge(subInput, numVertex, numIndex));
        numVertex = 0;
        numIndex = 0;
        subInput.length = 0;
      }

      numVertex += i.renderObject.vertices.length / 2;
      numIndex += i.renderObject.indices.length;
      subInput.push(i);
    }

    if (numIndex > 0) {
      result.push(doMerge(subInput, numVertex, numIndex));
    }
    return result;
  }
}

function doMerge(
  input: RenderObjectMerge[],
  numVertex: number,
  numIndex: number
): RenderObject {
  const vertices = new Float32Array(numVertex * 2);
  const colors = new Uint32Array(numVertex);
  const indices = new Uint16Array(numIndex);
  const bounds = rect.create();
  let vertexI = 0;
  let indexI = 0;
  for (const { renderObject, color, transform } of input) {
    for (let i = 0; i < renderObject.vertices.length; i += 2) {
      const outV = vertices.subarray(vertexI * 2 + i, vertexI * 2 + i + 2);
      const inV = renderObject.vertices.subarray(i, i + 2);
      vec2.transformMat2d(outV, inV, transform);
    }
    if (color == null) {
      colors.set(renderObject.colors, vertexI);
    } else {
      colors.fill(color, vertexI, vertexI + renderObject.colors.length);
    }
    indices.set(
      renderObject.indices.map((i) => i + vertexI),
      indexI
    );
    rect.union(
      bounds,
      bounds,
      rect.apply(rect.create(), renderObject.bounds, transform)
    );

    vertexI += renderObject.vertices.length / 2;
    indexI += renderObject.indices.length;
  }

  return new RenderObject(
    vertices,
    colors,
    indices,
    mat2d.identity(mat2d.create()),
    null,
    0,
    bounds
  );
}
