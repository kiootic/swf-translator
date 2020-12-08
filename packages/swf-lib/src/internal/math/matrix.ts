import { mat2d } from "gl-matrix";

export function projection(
  out: mat2d,
  width: number,
  height: number,
  invertY: boolean
) {
  mat2d.identity(out);
  out[0] = 2 / width;
  out[3] = (invertY ? -2 : 2) / height;
  out[4] = -1;
  out[5] = invertY ? 1 : -1;
  return out;
}

export function reduceAngle(angle: number) {
  while (angle > 180) {
    angle -= 360;
  }
  while (angle < -180) {
    angle += 360;
  }
  return angle;
}

export interface MatrixComposition {
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
}

export function decompose(m: mat2d): MatrixComposition {
  const det = mat2d.determinant(m);
  const scaleSign = det < 0 ? -1 : 1;
  const scaleX = Math.sqrt(m[0] * m[0] + m[1] * m[1]) * scaleSign;
  const scaleY = Math.sqrt(m[2] * m[2] + m[3] * m[3]) * scaleSign;
  const skewX = Math.atan2(m[3], m[2]) - Math.PI / 2;
  const skewY = Math.atan2(m[1], m[0]);
  return { scaleX, scaleY, skewX, skewY };
}

export function compose(m: mat2d, mc: MatrixComposition): boolean {
  const { skewX, skewY, scaleX, scaleY } = mc;
  // https://github.com/mozilla/shumway/blob/16451d8836fa85f4b16eeda8b4bda2fa9e2b22b0/src/flash/geom/Matrix.ts#L553
  if (
    (skewX === 0 || skewX === Math.PI * 2) &&
    (skewY === 0 || skewY === Math.PI * 2)
  ) {
    const isDirty = m[0] !== scaleX || m[3] !== scaleY;
    m[0] = scaleX;
    m[1] = 0;
    m[2] = 0;
    m[3] = scaleY;
    return isDirty;
  }

  const a = Math.cos(skewY) * scaleX;
  const b = Math.sin(skewY) * scaleX;
  const c = -Math.sin(skewX) * scaleY;
  const d = Math.cos(skewX) * scaleY;

  const isDirty = m[0] !== a || m[1] !== b || m[2] !== c || m[3] !== d;
  m[0] = a;
  m[1] = b;
  m[2] = c;
  m[3] = d;
  return isDirty;
}
