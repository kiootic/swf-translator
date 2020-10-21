import { dirname, relative } from "path";
import { format } from "prettier";

export class File {
  content: (Buffer | string)[] = [];

  constructor(readonly path: string) {}

  relPathTo(file: File): string {
    return relative(dirname(this.path), file.path);
  }

  finalize(): Buffer | null {
    const buf = Buffer.concat(this.content.map((c) => Buffer.from(c)));
    if (/\.(ts|js|json)$/.test(this.path)) {
      return Buffer.from(format(buf.toString(), { filepath: this.path }));
    }
    return buf;
  }
}
