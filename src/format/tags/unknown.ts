import { Tag } from "../tag";

export class TagUnknown extends Tag {
  private readonly _code: number;
  readonly body: Buffer;

  get code(): number {
    return this._code;
  }

  constructor(code: number, body: Buffer) {
    super();
    this._code = code;
    this.body = body;
  }
}
