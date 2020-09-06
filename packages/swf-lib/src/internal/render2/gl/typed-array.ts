export interface TypedArray extends ArrayBufferView {
  slice(): this;
  readonly length: number;
  [index: number]: number;
}

export interface TypedArrayConstructor<T extends TypedArray> {
  new (length: number): T;
  from(array: Iterable<number>): T;
}
