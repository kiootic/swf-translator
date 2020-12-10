export class Rectangle {
  static readonly __empty = new Rectangle();

  constructor(
    public x = 0,
    public y = 0,
    public width = 0,
    public height = 0
  ) {}

  equals(r: Rectangle) {
    return (
      this.x === r.x &&
      this.y === r.y &&
      this.width === r.width &&
      this.height === r.height
    );
  }
}
