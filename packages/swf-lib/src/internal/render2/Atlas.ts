import { rect } from "../math/rect";

const padding = 1;

export class Atlas {
  private x = 0;
  private y = 0;
  private rowHeight = 0;

  constructor(readonly width: number, readonly height: number) {}

  add(width: number, height: number): rect | null {
    let x = this.x;
    let y = this.y;

    if (this.x + width > this.width) {
      this.x = 0;
      this.y += this.rowHeight + padding;
      this.rowHeight = 0;

      x = this.x;
      y = this.y;
    }
    this.x += width;
    if (this.x > this.width) {
      return null;
    }
    this.x += padding;

    this.rowHeight = Math.max(this.rowHeight, height);
    if (this.y + this.rowHeight > this.height) {
      return null;
    }

    return rect.fromValues(x, y, width, height);
  }
}
