import { FilterInstance } from "../../../internal/render2/filter/Filter";

export abstract class BitmapFilter {
  abstract readonly __filter: FilterInstance;
}
