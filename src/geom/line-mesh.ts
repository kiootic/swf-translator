import { Tessellator } from "./tessellator";
import { generateBezierPoints } from "./bezier";
import { windingRule } from "libtess";
import { optimizeTriangles } from "./optimize";

enum LineCap {
  Round = 0,
  No = 1,
  Square = 2,
}

enum JoinCap {
  Round = 0,
  Bevel = 1,
  Miter = 2,
}

type Coords = [number, number];
type Line = [Coords, Coords];

export class LineMesh {
  private x: number = 0;
  private y: number = 0;
  private contour: Coords[];
  private vertices: Coords[];

  private width = 0;
  private startCap = LineCap.Round;
  private endCap = LineCap.Round;
  private joinCap = JoinCap.Round;
  private miterLimit = 1;
  private noClose: boolean = false;

  constructor() {
    this.contour = [];
    this.vertices = [];
  }

  lineStyle(
    width: number,
    startCap: number,
    endCap: number,
    joinCap: number,
    miterLimitFactor: number,
    noClose: boolean
  ) {
    this.buildContour();
    this.width = width;
    this.startCap = startCap;
    this.endCap = endCap;
    this.joinCap = joinCap;
    this.miterLimit = width * miterLimitFactor;
    this.noClose = noClose;
  }

  moveTo(x: number, y: number) {
    this.buildContour();
    if (this.x === x && this.y === y) {
      return;
    }
    this.x = x;
    this.y = y;
    this.contour.push([x, y]);
  }

  lineTo(x: number, y: number) {
    this.contour.push([x, y]);
    this.x = x;
    this.y = y;
  }

  curveTo(cx: number, cy: number, x: number, y: number) {
    const points = generateBezierPoints(this.x, this.y, cx, cy, x, y);
    for (const [x, y] of points) {
      this.lineTo(x, y);
    }
  }

  triangulate(): [number[], number[]] {
    this.buildContour();
    return optimizeTriangles(this.vertices);
  }

  private triangle(a: Coords, b: Coords, c: Coords) {
    this.vertices.push(a, b, c);
  }

  private buildContour() {
    const segments: Line[] = [];
    for (let i = 1; i < this.contour.length; i++) {
      const a = this.contour[i - 1],
        b = this.contour[i];
      if (a[0] === b[0] && a[1] === b[1]) {
        continue;
      }
      segments.push([a, b]);
    }

    if (segments.length === 0) {
      this.contour = [];
      return;
    }

    const radius = this.width / 2;

    const topLines: Line[] = [];
    const bottomLines: Line[] = [];
    const normals = segments.map(([a, b]) => normal(a, b));
    for (let i = 0; i < segments.length; i++) {
      const [a, b] = segments[i];
      const norm = normals[i];
      const at: Coords = [a[0] - norm[0] * radius, a[1] - norm[1] * radius];
      const ab: Coords = [a[0] + norm[0] * radius, a[1] + norm[1] * radius];
      const bt: Coords = [b[0] - norm[0] * radius, b[1] - norm[1] * radius];
      const bb: Coords = [b[0] + norm[0] * radius, b[1] + norm[1] * radius];
      topLines.push([at, bt]);
      bottomLines.push([at, bt]);

      if (i > 0) {
        const clockwise = cross2(diff(segments[i - 1][0], a), diff(a, b)) > 0;
        const lines = clockwise ? topLines : bottomLines;
        const prev = lines[topLines.length - 2];
        const next = lines[topLines.length - 1];
        switch (this.joinCap) {
          case JoinCap.Miter:
            this.miterJoin(this.miterLimit, a, prev, next);
            break;
          case JoinCap.Round:
            this.roundJoin(radius, a, prev, next);
            break;
          case JoinCap.Bevel:
            throw new Error("bevel cap is unsupported");
        }
      }

      this.triangle(at, bt, ab);
      this.triangle(ab, bt, bb);
    }

    if (
      first(segments)[0][0] === last(segments)[1][0] &&
      first(segments)[0][1] === last(segments)[1][1] &&
      !this.noClose
    ) {
      const clockwise =
        cross2(
          diff(last(segments)[0], last(segments)[1]),
          diff(first(segments)[0], first(segments)[1])
        ) > 0;
      const border = clockwise ? topLines : bottomLines;
      const prev = last(border);
      const next = first(border);

      switch (this.joinCap) {
        case JoinCap.Miter:
          this.miterJoin(this.miterLimit, first(segments)[0], prev, next);
          break;
        case JoinCap.Round:
          this.roundJoin(radius, first(segments)[0], prev, next);
          break;
        case JoinCap.Bevel:
          throw new Error("bevel cap is unsupported");
      }
    } else {
      switch (this.startCap) {
        case LineCap.No:
          break;
        case LineCap.Round:
          this.roundCap(radius, segments, topLines, bottomLines, first);
          break;
        case LineCap.Square:
          this.squareCap(radius, segments, topLines, bottomLines, last);
          break;
      }

      switch (this.endCap) {
        case LineCap.No:
          break;
        case LineCap.Round:
          this.roundCap(radius, segments, topLines, bottomLines, last);
          break;
        case LineCap.Square:
          this.squareCap(radius, segments, topLines, bottomLines, last);
          break;
      }
    }

    this.contour = [];
  }

  private emitCircle(radius: number, pt: Coords, from: Coords, to: Coords) {
    const begin = angle(pt, from);
    let end = angle(pt, to);
    while (end < begin) {
      end += Math.PI * 2;
    }

    const angleStep = 0.2;
    const n = Math.ceil((end - begin) / angleStep);
    let prev = from;
    for (let i = 0; i < n; i++) {
      const cpt: Coords = [
        pt[0] + radius * Math.cos(begin + angleStep * i),
        pt[1] + radius * Math.sin(begin + angleStep * i),
      ];
      this.triangle(prev, pt, cpt);
      prev = cpt;
    }
    this.triangle(prev, pt, to);
  }

  private roundJoin(radius: number, pt: Coords, prev: Line, next: Line) {
    this.emitCircle(radius, pt, prev[1], next[0]);
  }

  private miterJoin(limit: number, pt: Coords, prev: Line, next: Line) {
    const dp = normDiff(prev[0], prev[1]);
    const dq = normDiff(next[0], next[1]);

    const p = prev[0],
      r: Coords = [
        prev[1][0] - prev[0][0] + dp[0] * limit,
        prev[1][1] - prev[0][1] + dp[1] * limit,
      ];
    const q = next[0],
      s: Coords = [
        next[1][0] - next[0][0] + dq[0] * limit,
        next[1][1] - next[0][1] + dq[1] * limit,
      ];
    const n = cross2([q[0] - p[0], q[1] - p[1]], r);
    const d = cross2(r, s);
    if (d === 0) {
      return;
    }

    const u = n / d;
    const mpt: Coords = [q[0] + u * s[0], q[1] + u * s[1]];
    this.triangle(prev[1], mpt, pt);
    this.triangle(pt, mpt, next[0]);
  }

  private roundCap(
    radius: number,
    segments: Line[],
    top: Line[],
    bottom: Line[],
    item: ArrayItem
  ) {
    const pt = item(item(segments));
    this.emitCircle(
      radius,
      pt,
      item(item(item([bottom, top]))),
      item(item(item([top, bottom])))
    );
  }

  private squareCap(
    radius: number,
    segments: Line[],
    top: Line[],
    bottom: Line[],
    item: ArrayItem
  ) {
    const s = normDiff(item(segments)[0], item(segments)[1]);
    const a = item(item(bottom)),
      b: Coords = [a[0] + s[0] * radius, a[1] + s[1] * radius];
    const c = item(item(top)),
      d: Coords = [c[0] + s[0] * radius, c[1] + s[1] * radius];
    this.triangle(a, b, c);
    this.triangle(b, c, d);
  }
}

type ArrayItem = <T>(l: T[]) => T;
const first = <T>(l: T[]) => l[0];
const last = <T>(l: T[]) => l[l.length - 1];

function angle(a: Coords, b: Coords): number {
  return Math.atan2(b[1] - a[1], b[0] - a[0]);
}

function cross2(a: Coords, b: Coords): number {
  return a[0] * b[1] - a[1] * b[0];
}

function normal(a: Coords, b: Coords): Coords {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.sqrt(dx * dx + dy * dy);
  return [-dy / l, dx / l];
}

function diff(a: Coords, b: Coords): Coords {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return [dx, dy];
}

function normDiff(a: Coords, b: Coords): Coords {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.sqrt(dx * dx + dy * dy);
  return [dx / l, dy / l];
}
