export abstract class Tag {
  static readonly code: number;

  get code(): number {
    return (this.constructor as typeof Tag).code;
  }
}
