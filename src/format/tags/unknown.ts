import { Tag } from "../tag";
import { Reader } from "../../binary";

export class TagUnknown extends Tag {
  private readonly _code: number;
  readonly body: Buffer;

  get code(): number {
    return this._code;
  }

  constructor(code: number, body: Buffer) {
    super(new Reader(body));
    this._code = code;
    this.body = body;
  }

  parse() {}
}
