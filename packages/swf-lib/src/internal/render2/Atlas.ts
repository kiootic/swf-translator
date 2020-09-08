import { rect } from "../math/rect";

const padding = 2;

export class Atlas {
  private x = padding;
  private y = padding;
  private rowHeight = 0;

  constructor(readonly width: number, readonly height: number) {}

  add(width: number, height: number): rect | null {
    let x = this.x;
    let y = this.y;

    if (this.x + width + padding > this.width) {
      this.x = padding;
      this.y += this.rowHeight;
      this.rowHeight = 0;

      x = this.x;
      y = this.y;
    }
    this.x += width + padding;

    this.rowHeight = Math.max(this.rowHeight, height + padding);
    if (this.y + this.rowHeight > this.height) {
      return null;
    }

    return rect.fromValues(x, y, width, height);
  }
}
