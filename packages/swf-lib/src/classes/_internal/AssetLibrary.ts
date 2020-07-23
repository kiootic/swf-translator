import { Loader, LoaderResource, Texture } from "pixi.js";
import { Image as ImageCharacter } from "./character/Image";
import { Shape as ShapeCharacter } from "./character/Shape";
import { Sprite as SpriteCharacter } from "./character/Sprite";
import { Font as FontCharacter } from "./character/Font";
import { StaticText as StaticTextCharacter } from "./character/StaticText";
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

export interface AssetLibrary {
  resolveShape(id: number, shape: Shape): Shape;
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

  async instantiate(): Promise<AssetLibrary> {
    const library = new InstantiatedLibrary();
    const loader = new Loader();

    for (const [id, image] of this.images) {
      loader.add(`image${id}`, image.path, {}, (res: LoaderResource) => {
        library.images.set(id, new ImageInstance(id, res.texture));
      });
    }

    await new Promise((resolve) => loader.load(() => resolve()));

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

  resolveShape(id: number, shape: Shape): Shape {
    const instance = this.shapes.get(id);
    if (!instance) {
      throw new Error(`Shape character #${id} not found`);
    }

    instance.applyTo(shape.__pixi);
    return shape;
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
      shapeInstance.applyTo(shape.__pixi);
      shape.__character = shapeInstance;
      return shape;
    }

    const staticTextInstance = this.staticTexts.get(id);
    if (staticTextInstance) {
      const staticText = new StaticText();
      staticTextInstance.applyTo(staticText.__pixi);
      staticText.__character = staticTextInstance;
      return staticText;
    }

    const spriteInstance = this.sprites.get(id);
    if (spriteInstance) {
      const sprite =
        spriteInstance.numFrames > 1 ? new MovieClip() : new Sprite();
      spriteInstance.applyTo(sprite.__pixi, 1);
      sprite.__character = spriteInstance;
      return sprite;
    }

    throw new Error(`Character ${id} not found`);
  }
}
