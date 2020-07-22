import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { SpriteInstance } from "../../../internal/character/SpriteInstance";

export class Sprite extends DisplayObjectContainer {
  declare __character: SpriteInstance | null;
}
