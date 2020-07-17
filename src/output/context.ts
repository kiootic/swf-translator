import rimraf from "rimraf";
import mkdirp from "mkdirp";
import { join, dirname } from "path";
import { promises } from "fs";
import { promisify } from "util";

export class OutputContext {
  readonly files = new Map<string, Buffer>();

  addFile(content: Buffer, ...segments: string[]) {
    this.files.set(join(...segments), content);
  }

  async writeTo(directory: string) {
    await mkdirp(directory);
    await promisify(rimraf)(directory + "/*");

    for (const [relPath, content] of this.files) {
      const path = join(directory, relPath);
      mkdirp.sync(dirname(path));
      await promises.writeFile(path, content);
    }
  }
}
