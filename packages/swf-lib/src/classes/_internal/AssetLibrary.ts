import { ImageCharacter } from "./character/Image";
import { ShapeCharacter } from "./character/Shape";
import { FontCharacter } from "./character/Font";
import { StaticTextCharacter } from "./character/StaticText";
import { SpriteCharacter } from "./character/Sprite";
import type { DisplayObject } from "../flash/display/DisplayObject";
import { Shape } from "../flash/display/Shape";
import { Sprite } from "../flash/display/Sprite";
import { MovieClip } from "../flash/display/MovieClip";
import { StaticText } from "../flash/text/StaticText";
import { ImageInstance } from "../../internal/character/ImageInstance";
import { ShapeInstance } from "../../internal/character/ShapeInstance";
import { SpriteInstance } from "../../internal/character/SpriteInstance";
import { FontInstance } from "../../internal/character/FontInstance";
import { StaticTextInstance } from "../../internal/character/StaticTextInstance";
import { Texture } from "../../internal/render/Texture";
import { AssetBundle } from "./AssetBundle";

export interface AssetLibrary {
  resolveImage(id: number): Texture;
  resolveFont(id: number): FontInstance;

  instantiateCharacter(id: number): DisplayObject;
}

export class AssetLibraryBuilder {
  private readonly images = new Map<number, ImageCharacter>();
  private readonly shapes = new Map<number, ShapeCharacter>();
  private readonly sprites = new Map<number, SpriteCharacter>();
  private readonly fonts = new Map<number, FontCharacter>();
  private readonly staticTexts = new Map<number, StaticTextCharacter>();

  registerImage(id: number, char: ImageCharacter) {
    this.images.set(id, char);
  }

  registerShape(id: number, char: ShapeCharacter) {
    this.shapes.set(id, char);
  }

  registerSprite(id: number, char: SpriteCharacter) {
    this.sprites.set(id, char);
  }

  registerFont(id: number, char: FontCharacter) {
    this.fonts.set(id, char);
  }

  registerStaticText(id: number, char: StaticTextCharacter) {
    this.staticTexts.set(id, char);
  }

  registerBundle(bundle: AssetBundle) {
    for (const [id, char] of Object.entries(bundle.images)) {
      this.registerImage(Number(id), char);
    }
    for (const [id, char] of Object.entries(bundle.shapes)) {
      this.registerShape(Number(id), char);
    }
    for (const [id, char] of Object.entries(bundle.fonts)) {
      this.registerFont(Number(id), char);
    }
    for (const [id, char] of Object.entries(bundle.staticTexts)) {
      this.registerStaticText(Number(id), char);
    }
    for (const [id, char] of Object.entries(bundle.sprites)) {
      this.registerSprite(Number(id), char);
    }
  }

  async instantiate(): Promise<AssetLibrary> {
    const library = new InstantiatedLibrary();

    await Promise.all(
      [...this.images.entries()].map(async ([id, image]) => {
        const tex = await Texture.load(image.path);
        library.images.set(id, new ImageInstance(id, tex));
      })
    );

    for (const [id, shape] of this.shapes) {
      library.shapes.set(id, new ShapeInstance(id, shape, library));
    }

    for (const [id, sprite] of this.sprites) {
      library.sprites.set(id, new SpriteInstance(id, sprite, library));
    }

    for (const [id, font] of this.fonts) {
      library.fonts.set(id, new FontInstance(id, font, library));
    }

    for (const [id, staticText] of this.staticTexts) {
      library.staticTexts.set(
        id,
        new StaticTextInstance(id, staticText, library)
      );
    }

    return library;
  }
}

class InstantiatedLibrary implements AssetLibrary {
  readonly images = new Map<number, ImageInstance>();
  readonly shapes = new Map<number, ShapeInstance>();
  readonly sprites = new Map<number, SpriteInstance>();
  readonly fonts = new Map<number, FontInstance>();
  readonly staticTexts = new Map<number, StaticTextInstance>();

  resolveImage(id: number): Texture {
    const instance = this.images.get(id);
    if (!instance) {
      throw new Error(`Image character #${id} not found`);
    }

    return instance.texture;
  }

  resolveFont(id: number): FontInstance {
    const instance = this.fonts.get(id);
    if (!instance) {
      throw new Error(`Font character #${id} not found`);
    }

    return instance;
  }

  instantiateCharacter(id: number): DisplayObject {
    const shapeInstance = this.shapes.get(id);
    if (shapeInstance) {
      const shape = new Shape();
      shapeInstance.applyTo(shape);
      shape.__character = shapeInstance;
      return shape;
    }

    const staticTextInstance = this.staticTexts.get(id);
    if (staticTextInstance) {
      const staticText = new StaticText();
      staticTextInstance.applyTo(staticText);
      staticText.__character = staticTextInstance;
      return staticText;
    }

    const spriteInstance = this.sprites.get(id);
    if (spriteInstance) {
      const sprite =
        spriteInstance.numFrames > 1 ? new MovieClip() : new Sprite();
      spriteInstance.applyTo(sprite, 1, 1);
      sprite.__character = spriteInstance;
      return sprite;
    }

    throw new Error(`Character ${id} not found`);
  }
}
