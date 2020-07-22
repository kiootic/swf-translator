import { Reader, fixed, uint32, fixed8, uint16 } from "../../binary";
import { RGBA, rgba } from "./color";

export function filterList(reader: Reader): Filter[] {
  const filters: Filter[] = [];
  const n = reader.nextUInt8();
  for (let i = 0; i < n; i++) {
    filters.push(filter(reader));
  }
  return filters;
}

export type Filter = FilterDropShadow | FilterBlur | FilterGlow;

export enum FilterID {
  DropShadow = 0,
  Blur = 1,
  Glow = 2,
  Bevel = 3,
  GradientGlow = 4,
  Convolution = 5,
  ColorMatrix = 6,
  GradientBevel = 7,
}

export interface FilterDropShadow {
  id: FilterID.DropShadow;
  color: RGBA;
  blurX: number;
  blurY: number;
  angle: number;
  distance: number;
  strength: number;
  innerShadow: boolean;
  knockout: boolean;
  compositeSource: boolean;
  passes: number;
}

export interface FilterBlur {
  id: FilterID.Blur;
  blurX: number;
  blurY: number;
  passes: number;
}

export interface FilterGlow {
  id: FilterID.Glow;
  color: RGBA;
  blurX: number;
  blurY: number;
  strength: number;
  innerGlow: boolean;
  knockout: boolean;
  compositeSource: boolean;
  passes: number;
}

function filter(reader: Reader): Filter {
  const id = reader.nextUInt8();
  let filter: Filter;
  switch (id) {
    case FilterID.DropShadow:
      filter = {
        id: FilterID.DropShadow,
        color: rgba(reader),
        blurX: fixed(uint32)(reader),
        blurY: fixed(uint32)(reader),
        angle: fixed(uint32)(reader),
        distance: fixed(uint32)(reader),
        strength: fixed8(uint16)(reader),
        innerShadow: reader.nextBitBool(),
        knockout: reader.nextBitBool(),
        compositeSource: reader.nextBitBool(),
        passes: reader.nextBits(5),
      };
      break;

    case FilterID.Blur:
      filter = {
        id: FilterID.Blur,
        blurX: fixed(uint32)(reader),
        blurY: fixed(uint32)(reader),
        passes: reader.nextBits(5),
      };
      reader.nextBits(3);
      break;

    case FilterID.Glow:
      filter = {
        id: FilterID.Glow,
        color: rgba(reader),
        blurX: fixed(uint32)(reader),
        blurY: fixed(uint32)(reader),
        strength: fixed8(uint16)(reader),
        innerGlow: reader.nextBitBool(),
        knockout: reader.nextBitBool(),
        compositeSource: reader.nextBitBool(),
        passes: reader.nextBits(5),
      };
      break;

    default:
      throw new Error(`Unsupported filter ID: ${id}`);
  }
  return filter;
}
