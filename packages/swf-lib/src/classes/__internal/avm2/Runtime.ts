interface InterfaceClass<T> {
  readonly __IMPL: symbol;
  readonly prototype: T;
}

export class Runtime {
  static trace(...args: any[]) {
    console.log(...args);
  }

  static uint(value: any): number {
    return (value | 0) >>> 0;
  }

  static int(value: any): number {
    return value | 0;
  }

  static isInterface<T>(value: any, iface: InterfaceClass<T>): value is T {
    return iface.__IMPL in value;
  }
}
