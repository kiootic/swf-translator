import { ImageCharacter } from "./character/Image";
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
import { ImageInstance } from "../../internal/character/ImageInstance";
import { ShapeInstance } from "../../internal/character/ShapeInstance";
import { MorphShapeInstance } from "../../internal/character/MorphShapeInstance";
import { SpriteInstance } from "../../internal/character/SpriteInstance";
import { FontInstance } from "../../internal/character/FontInstance";
import { StaticTextInstance } from "../../internal/character/StaticTextInstance";
import { EditTextInstance } from "../../internal/character/EditTextInstance";
import { ButtonInstance } from "../../internal/character/ButtonInstance";
import { Texture } from "../../internal/render/Texture";
import { AssetBundle } from "./AssetBundle";
import { FontRegistry } from "./FontRegistry";
import { SimpleButton } from "../flash/display";

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
  private readonly editTexts = new Map<number, EditTextCharacter>();
  private readonly morphShapes = new Map<number, MorphShapeCharacter>();
  private readonly buttons = new Map<number, ButtonCharacter>();

  registerImage(id: number, char: ImageCharacter) {
    this.images.set(id, char);
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

  registerBundle(bundle: AssetBundle) {
    for (const [id, char] of Object.entries(bundle.images)) {
      this.registerImage(Number(id), char);
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

    return library;
  }
}

class InstantiatedLibrary implements AssetLibrary {
  readonly images = new Map<number, ImageInstance>();
  readonly shapes = new Map<number, ShapeInstance>();
  readonly morphShapes = new Map<number, MorphShapeInstance>();
  readonly sprites = new Map<number, SpriteInstance>();
  readonly fonts = new Map<number, FontInstance>();
  readonly staticTexts = new Map<number, StaticTextInstance>();
  readonly editTexts = new Map<number, EditTextInstance>();
  readonly buttons = new Map<number, ButtonInstance>();

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

    const morphShapeInstance = this.morphShapes.get(id);
    if (morphShapeInstance) {
      const morphShape = new MorphShape();
      morphShapeInstance.applyTo(morphShape);
      morphShape.__character = morphShapeInstance;
      return morphShape;
    }

    const staticTextInstance = this.staticTexts.get(id);
    if (staticTextInstance) {
      const staticText = new StaticText();
      staticTextInstance.applyTo(staticText);
      staticText.__character = staticTextInstance;
      return staticText;
    }

    const editTextInstance = this.editTexts.get(id);
    if (editTextInstance) {
      const textField = new TextField();
      editTextInstance.applyTo(textField);
      textField.__character = editTextInstance;
      return textField;
    }

    const buttonInstance = this.buttons.get(id);
    if (buttonInstance) {
      const button = new SimpleButton();
      buttonInstance.applyTo(button);
      button.__character = buttonInstance;
      return button;
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
