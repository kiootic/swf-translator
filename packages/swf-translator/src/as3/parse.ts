import { parser } from "./parser";
import * as terms from "./parser.terms";
import { Node } from "./node";

export interface File {
  path: string;
  node: Node;
}

export function parseAS3(path: string, source: string): File {
  // Parser adapted from https://github.com/lezer-parser/javascript
  return { path, node: new Node(source, parser.parse(source)) };
}

export { terms };
