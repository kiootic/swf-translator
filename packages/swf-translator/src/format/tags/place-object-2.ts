import { Tag } from "../tag";
import { Reader } from "../../binary";
import {
  Matrix,
  matrix,
  ColorTransformWithAlpha,
  colorTransformWithAlpha,
} from "../../format/structs";

export class PlaceObject2Tag extends Tag {
  static readonly code = 26;

  constructor(reader: Reader) {
    super();

    const hasClipActions = reader.nextBitBool();
    const hasClipDepth = reader.nextBitBool();
    const hasName = reader.nextBitBool();
    const hasRatio = reader.nextBitBool();
    const hasColorTransform = reader.nextBitBool();
    const hasMatrix = reader.nextBitBool();
    const hasCharacter = reader.nextBitBool();
    const isMove = reader.nextBitBool();

    this.depth = reader.nextUInt16();
    this.moveCharacter = isMove;
    if (hasCharacter) {
      this.placeCharacterId = reader.nextUInt16();
    }
    if (hasMatrix) {
      this.matrix = matrix(reader);
    }
    if (hasColorTransform) {
      this.colorTransform = colorTransformWithAlpha(reader);
    }
    if (hasRatio) {
      this.ratio = reader.nextUInt16();
    }
    if (hasName) {
      this.name = reader.nextString();
    }
    if (hasClipDepth) {
      this.clipDepth = reader.nextUInt16();
    }
    if (hasClipActions) {
      throw new Error("Clip actions are not supported");
    }
  }

  readonly depth: number;
  readonly moveCharacter: boolean;
  readonly placeCharacterId?: number;
  readonly matrix?: Matrix;
  readonly colorTransform?: ColorTransformWithAlpha;
  readonly ratio?: number;
  readonly name?: string;
  readonly clipDepth?: number;
}
