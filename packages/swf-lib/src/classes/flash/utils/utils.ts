import { Class } from "../../__internal/avm2/Class";
import { ClassRegistry } from "../../__internal";

export function getTimer() {
  return +new Date();
}

export function getDefinitionByName(name: string): Class | null {
  const classFn = ClassRegistry.instance.classes.get(name);
  return classFn ?? null;
}
