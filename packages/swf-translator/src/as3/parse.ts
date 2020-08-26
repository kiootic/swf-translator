import { parser } from "./parser";
import { Tree } from "lezer";

export interface File {
  path: string;
  source: string;
  tree: Tree;
}

export function parseAS3(path: string, source: string): File {
  // Parser adapted from https://github.com/lezer-parser/javascript
  return { path, source, tree: parser.parse(source) };
}
