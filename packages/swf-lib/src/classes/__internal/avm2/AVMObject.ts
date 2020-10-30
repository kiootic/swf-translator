const classMethods = new WeakMap<object, [string, Function][]>();

export class AVMObject {
  constructor() {
    let proto: any = Reflect.getPrototypeOf(this);
    let methods = classMethods.get(proto);
    if (!methods) {
      const protoMethods = new Map<string, Function>();
      while (proto && proto !== AVMObject.prototype) {
        for (const key of Reflect.ownKeys(proto)) {
          if (protoMethods.has(key as string)) {
            continue;
          }
          const desc = Reflect.getOwnPropertyDescriptor(proto, key);
          if (desc && typeof desc.value === "function") {
            protoMethods.set(key as string, desc.value);
          }
        }
        proto = Reflect.getPrototypeOf(proto);
      }
      protoMethods.delete("constructor");
      methods = Array.from(protoMethods.entries());
      classMethods.set(Reflect.getPrototypeOf(this), methods);
    }

    for (const [name, fn] of methods) {
      (this as any)[name] = fn.bind(this);
    }

    this.__preInit();
  }

  __preInit() {}
}
