import rimraf from "rimraf";
import { Project } from "ts-morph";
import mkdirp from "mkdirp";
import { join, dirname } from "path";
import { promises, existsSync } from "fs";
import { promisify } from "util";
import { File } from "./file";

export class OutputContext {
  private readonly project = new Project();
  private readonly files = new Map<string, File>();

  file(...segments: string[]): File {
    const path = join(...segments);
    const file = this.files.get(path) || new File(path, this.project);
    this.files.set(path, file);
    return file;
  }

  async writeTo(directory: string) {
    await mkdirp(directory);
    await promisify(rimraf)(directory + "/*");

    for (const [relPath, file] of this.files) {
      const path = join(directory, relPath);
      mkdirp.sync(dirname(path));

      const content = file.finalize();
      if (!content) {
        continue;
      }

      if (existsSync(path)) {
        const original = await promises.readFile(path);
        if (content.equals(original)) {
          continue;
        }
      }

      await promises.writeFile(path, content);
    }
  }
}
