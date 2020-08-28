import { Class } from "../../__internal/avm2/Class";

export function getTimer() {
  return +new Date();
}

export function getDefinitionByName(name: string): Class {
  throw "not implemented";
}
