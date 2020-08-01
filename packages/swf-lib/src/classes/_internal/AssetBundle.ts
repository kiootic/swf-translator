import { ImageCharacter } from "./character/Image";
import { ShapeCharacter } from "./character/Shape";
import { FontCharacter } from "./character/Font";
import { StaticTextCharacter } from "./character/StaticText";
import { SpriteCharacter } from "./character/Sprite";
import { EditTextCharacter } from "./character/EditText";
import { MorphShapeCharacter } from "./character";

export interface AssetBundle {
  images: Record<string | number, ImageCharacter>;
  shapes: Record<string | number, ShapeCharacter>;
  morphShapes: Record<string | number, MorphShapeCharacter>;
  fonts: Record<string | number, FontCharacter>;
  staticTexts: Record<string | number, StaticTextCharacter>;
  editTexts: Record<string | number, EditTextCharacter>;
  sprites: Record<string | number, SpriteCharacter>;
}
