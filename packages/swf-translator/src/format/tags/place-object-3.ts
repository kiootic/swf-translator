import { Tag } from "../tag";
import { Reader } from "../../binary";
import {
  Matrix,
  matrix,
  ColorTransformWithAlpha,
  colorTransformWithAlpha,
  Filter,
  filterList,
} from "../structs";

export class PlaceObject3Tag extends Tag {
  static readonly code = 70;

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

    reader.nextBitBool();
    const hasOpaqueBackground = reader.nextBitBool();
    const hasVisible = reader.nextBitBool();
    const hasImage = reader.nextBitBool();
    const hasClassName = reader.nextBitBool();
    const hasCacheAsBitmap = reader.nextBitBool();
    const hasBlendMode = reader.nextBitBool();
    const hasFilterList = reader.nextBitBool();

    this.depth = reader.nextUInt16();
    this.moveCharacter = isMove;
    if (hasImage) {
      throw new Error("Image is not supported");
    }
    if (hasClassName) {
      throw new Error("Class name is not supported");
    }
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
    if (hasFilterList) {
      this.filters = filterList(reader);
    }
    if (hasBlendMode) {
      this.blendMode = reader.nextUInt8();
    }
    if (hasCacheAsBitmap) {
      this.cacheAsBitmap = reader.nextUInt8() !== 0;
    }
    if (hasVisible) {
      this.visible = reader.nextUInt8() !== 0;
    }
    if (hasOpaqueBackground) {
      throw new Error("Opaque background color is not supported");
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

  readonly filters?: Filter[];
  readonly blendMode?: number;
  readonly cacheAsBitmap?: boolean;
  readonly visible?: boolean;
}
