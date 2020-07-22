import { Loader, LoaderResource, Texture } from "pixi.js";
import { Image as ImageCharacter } from "./character/Image";
import { Shape as ShapeCharacter } from "./character/Shape";
import { Sprite as SpriteCharacter } from "./character/Sprite";
import { Shape } from "../flash/display/Shape";
import { ImageInstance } from "../../internal/character/ImageInstance";
import { ShapeInstance } from "../../internal/character/ShapeInstance";
import { SpriteInstance } from "../../internal/character/SpriteInstance";

export interface AssetLibrary {
  resolveShape(id: number, shape: Shape): Shape;
  resolveImage(id: number): Texture;
}

export class AssetLibraryBuilder {
  private readonly images = new Map<number, ImageCharacter>();
  private readonly shapes = new Map<number, ShapeCharacter>();
  private readonly sprites = new Map<number, SpriteCharacter>();

  registerImage(id: number, char: ImageCharacter) {
    this.images.set(id, char);
  }

  registerShape(id: number, char: ShapeCharacter) {
    this.shapes.set(id, char);
  }

  registerSprite(id: number, char: SpriteCharacter) {
    this.sprites.set(id, char);
  }

  async instantiate(): Promise<AssetLibrary> {
    const library = new InstantiatedLibrary();
    const loader = new Loader();

    for (const [id, image] of this.images) {
      loader.add(`image${id}`, image.path, {}, (res: LoaderResource) => {
        library.images.set(id, new ImageInstance(res.texture));
      });
    }

    await new Promise((resolve) => loader.load(() => resolve()));

    for (const [id, shape] of this.shapes) {
      library.shapes.set(id, new ShapeInstance(shape, library));
    }

    for (const [id, sprite] of this.sprites) {
      library.sprites.set(id, new SpriteInstance(sprite, library));
    }

    return library;
  }
}

class InstantiatedLibrary implements AssetLibrary {
  readonly images = new Map<number, ImageInstance>();
  readonly shapes = new Map<number, ShapeInstance>();
  readonly sprites = new Map<number, SpriteInstance>();

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
}
