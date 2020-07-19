export function optimizeTriangles(
  vertices: [number, number][]
): [number[], number[]] {
  const verticesMap = new Map<string, number>();
  const data: number[] = [];
  const indices: number[] = [];

  for (const [x, y] of vertices) {
    const key = `${x}:${y}`;
    let index = verticesMap.get(key);
    if (index == null) {
      index = data.length / 2;
      data.push(x, y);
      verticesMap.set(key, index);
    }
    indices.push(index);
  }

  return [data, indices];
}
