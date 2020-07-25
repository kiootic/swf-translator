import { CharacterInstance } from "./CharacterInstance";
import { Texture } from "../render/Texture";

export class ImageInstance implements CharacterInstance {
  constructor(readonly id: number, readonly texture: Texture) {}
}
