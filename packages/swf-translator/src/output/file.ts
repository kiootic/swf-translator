import { dirname, relative } from "path";
import { Project, SourceFile } from "ts-morph";

export class File {
  content: Buffer | null = null;
  private tsSourceFile: SourceFile | null = null;

  constructor(readonly path: string, private readonly project: Project) {}

  get tsSource(): SourceFile {
    return (
      this.tsSourceFile ??
      (this.tsSourceFile = this.project.createSourceFile(this.path))
    );
  }

  relPathTo(file: File): string {
    return relative(dirname(this.path), file.path);
  }

  finalize(): Buffer | null {
    if (this.tsSourceFile) {
      // PERF: too slow for large file
      // this.tsSourceFile.formatText();
      return Buffer.from(this.tsSourceFile.getFullText());
    }
    return this.content;
  }
}
