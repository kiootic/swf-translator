export abstract class Tag {
  static readonly code: number;

  readonly characterId: number | null = null;

  get code(): number {
    return (this.constructor as typeof Tag).code;
  }
}
