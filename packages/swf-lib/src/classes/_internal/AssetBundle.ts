import { ImageCharacter } from "./character/Image";
import { ShapeCharacter } from "./character/Shape";
import { FontCharacter } from "./character/Font";
import { StaticTextCharacter } from "./character/StaticText";
import { SpriteCharacter } from "./character/Sprite";

export interface AssetBundle {
  images: Record<string | number, ImageCharacter>;
  shapes: Record<string | number, ShapeCharacter>;
  fonts: Record<string | number, FontCharacter>;
  staticTexts: Record<string | number, StaticTextCharacter>;
  sprites: Record<string | number, SpriteCharacter>;
}
