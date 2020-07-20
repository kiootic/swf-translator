export type Bezier = (t: number) => [number, number];

export function bezierCurve(
  startX: number,
  startY: number,
  controlX: number,
  controlY: number,
  endX: number,
  endY: number
): Bezier {
  return (t) => [
    (startX - 2 * controlX + endX) * t * t +
      2 * (controlX - startX) * t +
      startX,
    (startY - 2 * controlY + endY) * t * t +
      2 * (controlY - startY) * t +
      startY,
  ];
}

function estimateCurveLength(bezier: Bezier): number {
  const step = 0.01;
  let [x, y] = bezier(0);
  let length = 0;
  for (let t = 0; t < 1; t += step) {
    const [px, py] = bezier(t);
    length += Math.sqrt((px - x) * (px - x) + (py - y) * (py - y));
    x = px;
    y = py;
  }
  return length;
}

export function generateBezierPoints(
  startX: number,
  startY: number,
  controlX: number,
  controlY: number,
  endX: number,
  endY: number
): [number, number][] {
  const bezier = bezierCurve(startX, startY, controlX, controlY, endX, endY);
  let numSegments = Math.ceil(estimateCurveLength(bezier) / 200);
  if (numSegments < 8) {
    numSegments = 8;
  } else if (numSegments > 100) {
    numSegments = 100;
  }

  const points: [number, number][] = [[startX, startY]];
  for (let i = 1; i < numSegments; i++) {
    points.push(bezier(i / numSegments));
  }
  points.push([endX, endY]);
  return points;
}
