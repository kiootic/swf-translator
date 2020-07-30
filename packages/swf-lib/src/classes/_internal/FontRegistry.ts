import { FontInstance } from "../../internal/character/FontInstance";

export class FontRegistry {
  static readonly instance = new FontRegistry();

  readonly fonts = new Map<string, FontInstance[]>();

  private constructor() {}

  registerFont(font: FontInstance) {
    const instances = this.fonts.get(font.font.name) || [];
    instances.push(font);
    this.fonts.set(font.font.name, instances);
  }

  resolve(
    name: string,
    isItalic: boolean,
    isBold: boolean
  ): FontInstance | null {
    const instances = this.fonts.get(name) || [];

    for (const instance of instances) {
      if (
        instance.font.isItalic === isItalic &&
        instance.font.isBold === isBold
      ) {
        return instance;
      }
    }
    return null;
  }
}
