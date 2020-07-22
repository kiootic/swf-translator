import { Texture } from "pixi.js";
import { CharacterInstance } from "./CharacterInstance";

export class ImageInstance implements CharacterInstance {
  constructor(readonly id: number, readonly texture: Texture) {}
}
