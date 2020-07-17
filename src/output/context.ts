import rimraf from "rimraf";
import mkdirp from "mkdirp";
import { join, dirname } from "path";
import { writeFileSync } from "fs";

export class OutputContext {
  readonly files = new Map<string, Buffer>();

  writeTo(directory: string) {
    mkdirp.sync(directory);
    rimraf.sync(directory + "/*");

    for (const [relPath, content] of this.files) {
      const path = join(directory, relPath);
      mkdirp.sync(dirname(path));
      writeFileSync(path, content);
    }
  }
}
