export type Filter = FilterDropShadow | FilterBlur;

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
