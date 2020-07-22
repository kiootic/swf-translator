import {
  Sprite as SpriteCharacter,
  SpriteFrame,
} from "../../classes/_internal/character";
import type { AssetLibrary } from "../../classes/_internal";

export class SpriteInstance {
  readonly frames: SpriteFrame[];

  constructor(sprite: SpriteCharacter, readonly library: AssetLibrary) {
    this.frames = sprite.frames;
  }
}
