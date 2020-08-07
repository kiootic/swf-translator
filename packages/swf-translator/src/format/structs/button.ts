import { Matrix, matrix } from "./geom";
import { ColorTransformWithAlpha, colorTransformWithAlpha } from "./color";
import { Filter, filterList } from "./filter";
import { Parser } from "../../binary";

export interface ButtonRecord {
  hitTest: boolean;
  down: boolean;
  over: boolean;
  up: boolean;
  characterId: number;
  depth: number;
  matrix: Matrix;
  colorTransform: ColorTransformWithAlpha;
  filters?: Filter[];
  blendMode?: number;
}

export function buttonRecord(version: 1 | 2): Parser<ButtonRecord | null> {
  return (reader) => {
    reader.nextBits(2);
    const hasBlendMode = reader.nextBitBool();
    const hasFilterList = reader.nextBitBool();
    const hitTest = reader.nextBitBool();
    const down = reader.nextBitBool();
    const over = reader.nextBitBool();
    const up = reader.nextBitBool();
    if (!hitTest && !down && !over && !up) {
      return null;
    }

    const characterId = reader.nextUInt16();
    const depth = reader.nextUInt16();
    const mat = matrix(reader);
    const colorTransform = colorTransformWithAlpha(reader);
    const filters = hasFilterList ? filterList(reader) : undefined;
    const blendMode = hasBlendMode ? reader.nextUInt8() : undefined;

    return {
      hitTest,
      down,
      over,
      up,
      characterId,
      depth,
      matrix: mat,
      colorTransform,
      filters,
      blendMode,
    };
  };
}

export function buttonRecordList(version: 1 | 2): Parser<ButtonRecord[]> {
  const parser = buttonRecord(version);
  return (reader) => {
    const records: ButtonRecord[] = [];
    let record: ButtonRecord | null;
    while ((record = parser(reader))) {
      records.push(record);
    }
    return records;
  };
}
