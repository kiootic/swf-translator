import { CharacterInstance } from "./CharacterInstance";

export class ImageInstance implements CharacterInstance {
  constructor(readonly id: number, readonly image: HTMLImageElement) {}
}
