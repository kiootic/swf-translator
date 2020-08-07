import {
  Filter as SWFFilter,
  FilterID as RawFilterID,
} from "../format/structs";
import { color } from "./primitives";

export type Filter = FilterDropShadow | FilterBlur;

export function filter(filter: SWFFilter): Filter {
  switch (filter.id) {
    case RawFilterID.DropShadow:
      return {
        id: FilterID.DropShadow,
        color: color(filter.color),
        blurX: filter.blurX,
        blurY: filter.blurY,
        angle: filter.angle,
        distance: filter.distance,
        strength: filter.strength,
        inner: filter.innerShadow,
        knockout: filter.knockout,
        compositeSource: filter.compositeSource,
        passes: filter.passes,
      };

    case RawFilterID.Blur:
      return {
        id: FilterID.Blur,
        blurX: filter.blurX,
        blurY: filter.blurY,
        passes: filter.passes,
      };

    case RawFilterID.Glow:
      return {
        id: FilterID.DropShadow,
        color: color(filter.color),
        blurX: filter.blurX,
        blurY: filter.blurY,
        angle: 0,
        distance: 0,
        strength: filter.strength,
        inner: filter.innerGlow,
        knockout: filter.knockout,
        compositeSource: filter.compositeSource,
        passes: filter.passes,
      };
  }
}

export enum FilterID {
  DropShadow = 0,
  Blur = 1,
}

export interface FilterDropShadow {
  id: FilterID.DropShadow;
  color: number;
  blurX: number;
  blurY: number;
  angle: number;
  distance: number;
  strength: number;
  inner: boolean;
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
