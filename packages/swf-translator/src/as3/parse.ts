import { parser } from "./parser";
import { Tree } from "lezer";

export interface File {
  path: string;
  tree: Tree;
}

export function parseAS3(path: string, src: string): File {
  // Parser adapted from https://github.com/lezer-parser/javascript
  return { path, tree: parser.parse(src) };
}
