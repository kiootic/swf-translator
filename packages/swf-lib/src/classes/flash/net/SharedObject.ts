import { EventDispatcher } from "../events/EventDispatcher";

export class SharedObject extends EventDispatcher {
  readonly data: any;

  private constructor(private readonly name: string) {
    super();
    try {
      this.data = JSON.parse(localStorage[name]) || {};
    } catch {
      this.data = {};
    }
  }

  static getLocal(name: string): SharedObject {
    return new SharedObject(name);
  }

  flush() {
    localStorage[this.name] = JSON.stringify(this.data);
  }
}
