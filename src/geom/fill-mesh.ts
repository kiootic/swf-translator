import { Tessellator } from "./tessellator";
import { generateBezierPoints } from "./bezier";

export class FillMesh extends Tessellator {
  private x: number = 0;
  private y: number = 0;
  private contour: [number, number][];

  constructor() {
    super();

    this.contour = [];
    this.contours.push(this.contour);
  }

  moveTo(x: number, y: number) {
    if (this.x === x && this.y === y) {
      return;
    }
    this.x = x;
    this.y = y;
    if (this.contour.length > 0) {
      this.contour = [];
      this.contours.push(this.contour);
    }
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
}
