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
import { Manifest } from "./Manifest";
import { Properties } from "./Properties";

async function fetchData(
  url: string,
  size: number,
  progress: (loaded: number, size: number) => void
): Promise<Uint8Array> {
  progress(0, size);

  const resp = await fetch(url);
  const reader = resp.body!.getReader();

  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const result = await reader.read();

    if (result.done) {
      break;
    }

    chunks.push(result.value);
    received += result.value.length;
    progress(received, size);
  }

  const result = new Uint8Array(received);
  let i = 0;
  for (const chunk of chunks) {
    result.set(chunk, i);
    i += chunk.length;
  }

  progress(received, received);
  return result;
}

export async function loadManifest(
  manifest: Manifest,
  progress?: (value: number) => void
): Promise<AssetLibrary> {
  const progresses = new Map<string, [number, number]>();
  for (const [id, { size }] of Object.entries(manifest.assets)) {
    progresses.set(id, [0, size]);
  }
  const reportProgress = (id: string) => (loaded: number, size: number) => {
    progresses.set(id, [loaded, size]);
    let allLoaded = 0;
    let allSize = 0;
    for (const [l, s] of progresses.values()) {
      allLoaded += l;
      allSize += s;
    }
    progress?.(allLoaded / allSize);
  };

  const dataAsset = manifest.assets[manifest.data];
  const data = await fetchData(
    dataAsset.url.toString(),
    dataAsset.size,
    reportProgress(manifest.data)
  );
  const bundle: AssetBundle = JSON.parse(new TextDecoder().decode(data));

  const library = new AssetLibrary(manifest.properties);

  await Promise.all([
    ...Array.from(Object.entries(bundle.images)).map(
      async ([charId, { id }]) => {
        const asset = manifest.assets[id];
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const report = reportProgress(id);
          report(0, asset.size);
          let loaded = 0;

          const img = new Image();
          img.onload = () => {
            report(loaded, loaded);
            resolve(img);
          };
          img.onerror = (e) => reject(e);
          img.onprogress = (e) => {
            loaded = e.loaded;
            report(loaded, asset.size);
          };
          img.src = asset.url.toString();
        });
        library.images.set(
          Number(charId),
          new ImageInstance(Number(charId), img)
        );
      }
    ),
    ...Array.from(Object.entries(bundle.sounds)).map(
      async ([charId, { id }]) => {
        const asset = manifest.assets[id];
        const data = await fetchData(
          asset.url.toString(),
          asset.size,
          reportProgress(id)
        );
        const buf = await Audio.decodeAudioData(data.buffer);
        library.sounds.set(
          Number(charId),
          new SoundInstance(Number(charId), buf)
        );
      }
    ),
  ]);

  for (const [id, shape] of Object.entries(bundle.shapes)) {
    const charId = Number(id);
    library.shapes.set(charId, new ShapeInstance(charId, shape, library));
  }

  for (const [id, morphShape] of Object.entries(bundle.morphShapes)) {
    const charId = Number(id);
    const instance = new MorphShapeInstance(charId, morphShape, library);
    library.morphShapes.set(charId, instance);
  }

  for (const [id, sprite] of Object.entries(bundle.sprites)) {
    const charId = Number(id);
    library.sprites.set(charId, new SpriteInstance(charId, sprite, library));
  }

  for (const [id, font] of Object.entries(bundle.fonts)) {
    const charId = Number(id);
    const instance = new FontInstance(charId, font, library);
    library.fonts.set(charId, instance);
    FontRegistry.instance.registerFont(instance);
  }

  for (const [id, staticText] of Object.entries(bundle.staticTexts)) {
    const charId = Number(id);
    const instance = new StaticTextInstance(charId, staticText, library);
    library.staticTexts.set(charId, instance);
  }

  for (const [id, editText] of Object.entries(bundle.editTexts)) {
    const charId = Number(id);
    const instance = new EditTextInstance(charId, editText, library);
    library.editTexts.set(charId, instance);
  }

  for (const [id, button] of Object.entries(bundle.buttons)) {
    const charId = Number(id);
    const instance = new ButtonInstance(charId, button, library);
    library.buttons.set(charId, instance);
  }

  for (const [id, className] of Object.entries(bundle.linkages)) {
    const classFn = ClassRegistry.instance.classes.get(className);
    if (!classFn) {
      throw new Error(`Linked class ${className} not found`);
    }
    const charId = Number(id);
    library.linkedClasses.set(charId, classFn);
  }

  library.linkCharacters();
  return library;
}

export class AssetLibrary {
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

  constructor(readonly properties: Properties) {}

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
