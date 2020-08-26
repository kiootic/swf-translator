import { ClassDef } from "./code/structure";

export class AS3Context {
  readonly classes = new Map<string, ClassDef>();

  addClass(def: ClassDef) {
    this.classes.set(`${def.namespace}::${def.name}`, def);
  }

  resolveClass(namespace: string, name: string) {
    return this.classes.get(`${namespace}::${name}`);
  }
}
