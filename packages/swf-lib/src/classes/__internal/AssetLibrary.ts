import { ImageCharacter } from "./character/Image";
import { SoundCharacter } from "./character/Sound";
import { ShapeCharacter } from "./character/Shape";
import { FontCharacter } from "./character/Font";
import { StaticTextCharacter } from "./character/StaticText";
import { EditTextCharacter } from "./character/EditText";
import { SpriteCharacter } from "./character/Sprite";
import { MorphShapeCharacter } from "./character/MorphShape";
import { ButtonCharacter } from "./character/Button";
import type { DisplayObject } from "../flash/display/DisplayObject";
import { Shape } from "../flash/display/Shape";
import { MorphShape } from "../flash/display/MorphShape";
import { Sprite } from "../flash/display/Sprite";
import { MovieClip } from "../flash/display/MovieClip";
import { StaticText } from "../flash/text/StaticText";
import { TextField } from "../flash/text";
import { Sound } from "../flash/media";
import { ImageInstance } from "../../internal/character/ImageInstance";
import { SoundInstance } from "../../internal/character/SoundInstance";
import { ShapeInstance } from "../../internal/character/ShapeInstance";
import { MorphShapeInstance } from "../../internal/character/MorphShapeInstance";
import { SpriteInstance } from "../../internal/character/SpriteInstance";
import { FontInstance } from "../../internal/character/FontInstance";
import { StaticTextInstance } from "../../internal/character/StaticTextInstance";
import { EditTextInstance } from "../../internal/character/EditTextInstance";
import { ButtonInstance } from "../../internal/character/ButtonInstance";
import { AssetBundle } from "./AssetBundle";
import { FontRegistry } from "./FontRegistry";
import { SimpleButton } from "../flash/display";
import { ClassRegistry } from "./ClassRegistry";
import { Audio } from "../../internal/audio";

export interface AssetLibrary {
  readonly gradientCache: Map<string, HTMLCanvasElement>;
  resolveImage(id: number): HTMLImageElement;
  resolveFont(id: number): FontInstance;

  instantiateCharacter(id: number): DisplayObject;
}

export class AssetLibraryBuilder {
  private readonly images = new Map<number, ImageCharacter>();
  private readonly sounds = new Map<number, SoundCharacter>();
  private readonly shapes = new Map<number, ShapeCharacter>();
  private readonly sprites = new Map<number, SpriteCharacter>();
  private readonly fonts = new Map<number, FontCharacter>();
  private readonly staticTexts = new Map<number, StaticTextCharacter>();
  private readonly editTexts = new Map<number, EditTextCharacter>();
  private readonly morphShapes = new Map<number, MorphShapeCharacter>();
  private readonly buttons = new Map<number, ButtonCharacter>();
  private readonly linkages = new Map<number, string>();

  registerImage(id: number, char: ImageCharacter) {
    this.images.set(id, char);
  }

  registerSound(id: number, char: SoundCharacter) {
    this.sounds.set(id, char);
  }

  registerShape(id: number, char: ShapeCharacter) {
    this.shapes.set(id, char);
  }

  registerMorphShape(id: number, char: MorphShapeCharacter) {
    this.morphShapes.set(id, char);
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

  registerEditText(id: number, char: EditTextCharacter) {
    this.editTexts.set(id, char);
  }

  registerButton(id: number, char: ButtonCharacter) {
    this.buttons.set(id, char);
  }

  registerLinkage(id: number, className: string) {
    this.linkages.set(id, className);
  }

  registerBundle(bundle: AssetBundle) {
    for (const [id, char] of Object.entries(bundle.images)) {
      this.registerImage(Number(id), char);
    }
    for (const [id, char] of Object.entries(bundle.sounds)) {
      this.registerSound(Number(id), char);
    }
    for (const [id, char] of Object.entries(bundle.shapes)) {
      this.registerShape(Number(id), char);
    }
    for (const [id, char] of Object.entries(bundle.morphShapes)) {
      this.registerMorphShape(Number(id), char);
    }
    for (const [id, char] of Object.entries(bundle.fonts)) {
      this.registerFont(Number(id), char);
    }
    for (const [id, char] of Object.entries(bundle.staticTexts)) {
      this.registerStaticText(Number(id), char);
    }
    for (const [id, char] of Object.entries(bundle.editTexts)) {
      this.registerEditText(Number(id), char);
    }
    for (const [id, char] of Object.entries(bundle.sprites)) {
      this.registerSprite(Number(id), char);
    }
    for (const [id, char] of Object.entries(bundle.buttons)) {
      this.registerButton(Number(id), char);
    }
    for (const [id, className] of Object.entries(bundle.linkages)) {
      this.registerLinkage(Number(id), className);
    }
  }

  async instantiate(): Promise<AssetLibrary> {
    const library = new InstantiatedLibrary();

    await Promise.all([
      ...Array.from(this.images.entries()).map(async ([id, image]) => {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = image.path;
        });
        library.images.set(id, new ImageInstance(id, img));
      }),
      ...Array.from(this.sounds.entries()).map(async ([id, image]) => {
        const data = await fetch(image.path).then((resp) => resp.arrayBuffer());
        const buf = await Audio.decodeAudioData(data);
        library.sounds.set(id, new SoundInstance(id, buf));
      }),
    ]);

    for (const [id, shape] of this.shapes) {
      library.shapes.set(id, new ShapeInstance(id, shape, library));
    }

    for (const [id, morphShape] of this.morphShapes) {
      library.morphShapes.set(
        id,
        new MorphShapeInstance(id, morphShape, library)
      );
    }

    for (const [id, sprite] of this.sprites) {
      library.sprites.set(id, new SpriteInstance(id, sprite, library));
    }

    for (const [id, font] of this.fonts) {
      const instance = new FontInstance(id, font, library);
      library.fonts.set(id, instance);
      FontRegistry.instance.registerFont(instance);
    }

    for (const [id, staticText] of this.staticTexts) {
      library.staticTexts.set(
        id,
        new StaticTextInstance(id, staticText, library)
      );
    }

    for (const [id, editText] of this.editTexts) {
      library.editTexts.set(id, new EditTextInstance(id, editText, library));
    }

    for (const [id, button] of this.buttons) {
      library.buttons.set(id, new ButtonInstance(id, button, library));
    }

    for (const [id, className] of this.linkages) {
      const classFn = ClassRegistry.instance.classes.get(className);
      if (!classFn) {
        throw new Error(`Linked class ${className} not found`);
      }
      library.linkedClasses.set(id, classFn);
    }

    library.linkCharacters();
    return library;
  }
}

class InstantiatedLibrary implements AssetLibrary {
  readonly images = new Map<number, ImageInstance>();
  readonly sounds = new Map<number, SoundInstance>();
  readonly shapes = new Map<number, ShapeInstance>();
  readonly morphShapes = new Map<number, MorphShapeInstance>();
  readonly sprites = new Map<number, SpriteInstance>();
  readonly fonts = new Map<number, FontInstance>();
  readonly staticTexts = new Map<number, StaticTextInstance>();
  readonly editTexts = new Map<number, EditTextInstance>();
  readonly buttons = new Map<number, ButtonInstance>();
  readonly linkedClasses = new Map<number, Function>();

  readonly gradientCache = new Map<string, HTMLCanvasElement>();

  resolveImage(id: number): HTMLImageElement {
    const instance = this.images.get(id);
    if (!instance) {
      throw new Error(`Image character #${id} not found`);
    }

    return instance.image;
  }

  resolveFont(id: number): FontInstance {
    const instance = this.fonts.get(id);
    if (!instance) {
      throw new Error(`Font character #${id} not found`);
    }

    return instance;
  }

  linkCharacters() {
    type Class = new () => object;
    const link = <T>(
      characters: Map<number, T>,
      defaultClassFactory: (char: T) => Class
    ) => {
      for (const [id, char] of characters) {
        let classFn = this.linkedClasses.get(id);
        if (!classFn) {
          const className = `Character${id}`;
          classFn = class extends defaultClassFactory(char) {};
          Object.defineProperty(classFn, "name", { value: className });
          this.linkedClasses.set(id, classFn);
        }
        Object.assign(classFn, { __character: char });
      }
    };

    link(this.sounds, () => Sound);
    link(this.shapes, () => Shape);
    link(this.morphShapes, () => MorphShape);
    link(this.sprites, (s) => (s.numFrames > 1 ? MovieClip : Sprite));
    link(this.staticTexts, () => StaticText);
    link(this.editTexts, () => TextField);
    link(this.buttons, () => SimpleButton);
  }

  instantiateCharacter<T>(id: number): T {
    const classFn = this.linkedClasses.get(id) as new () => T;
    if (!classFn) {
      throw new Error(`Character ${id} not found`);
    }

    return new classFn();
  }
}
