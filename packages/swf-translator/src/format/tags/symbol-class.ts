import { Tag } from "../tag";
import { Reader, object, uint16, string } from "../../binary";

export interface SymbolClass {
  characterId: number;
  name: string;
}

const symbolClass = object<SymbolClass>(
  ["characterId", uint16],
  ["name", string]
);

export class SymbolClassTag extends Tag {
  static readonly code = 76;

  constructor(reader: Reader) {
    super();
    const n = reader.nextUInt16();

    for (let i = 0; i < n; i++) {
      this.symbols.push(symbolClass(reader));
    }
  }

  readonly symbols: SymbolClass[] = [];
}
