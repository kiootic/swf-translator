import { Reader } from "../binary";

export abstract class Tag {
  static readonly code: number;

  get code(): number {
    return (this.constructor as typeof Tag).code;
  }

  constructor(reader: Reader) {
    this.parse(reader);
  }

  protected abstract parse(reader: Reader): void;
}
