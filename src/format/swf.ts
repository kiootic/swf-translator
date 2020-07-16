import { Parser } from "binary-parser";
import { inflateSync } from "zlib";

const parserHeader1 = new Parser()
  .string("sig", { length: 3 })
  .uint8("version")
  .uint32le("length");

export class SWFFile {
  readonly version: number;

  constructor(buf: Buffer) {
    const header1 = parserHeader1.parse(buf);
    this.version = header1.version;

    let body: Buffer;
    switch (header1.sig) {
      case "CWS":
        body = inflateSync(buf.slice(8));
        break;
      default:
        throw new Error(`Unsupported signature: ${header1.sig}`);
    }
    if (header1.length !== body.length + 8) {
      throw new Error(
        `Mismatched length: ${header1.length} != ${body.length + 8}`
      );
    }
  }
}
