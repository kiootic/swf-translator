export class ClassRegistry {
  static readonly instance = new ClassRegistry();

  readonly classes = new Map<string, Function>();

  private constructor() {}

  addClassRoot(root: object) {
    const addPackage = (name: string, pack: object) => {
      for (const [key, value] of Object.entries(pack)) {
        const entryName = name === "" ? key : `${name}.${key}`;
        if (typeof value === "function") {
          this.classes.set(entryName, value);
        } else if (typeof value === "object") {
          addPackage(entryName, value);
        }
      }
    };
    addPackage("", root);
  }
}
