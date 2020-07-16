import { Reader } from "./reader";

export type Parser<T> = (reader: Reader) => T;

export function transform<T, U>(
  parser: Parser<T>,
  mapper: (value: T) => U
): Parser<U> {
  return (reader) => mapper(parser(reader));
}

export function object<T>(
  ...fields: Array<[keyof T, Parser<T[keyof T]>]>
): Parser<T> {
  return (reader) => {
    const obj: any = {};
    for (const [name, parser] of fields) {
      obj[name] = parser(reader);
    }
    return obj;
  };
}

export const uint8: Parser<number> = (reader) => reader.nextUInt8();
export const uint16: Parser<number> = (reader) => reader.nextUInt16();
export const uint32: Parser<number> = (reader) => reader.nextUInt32();

export function fixedString(length: number): Parser<string> {
  return (reader) => reader.nextFixedString(length);
}

export function ubits(nBits: number): Parser<number> {
  return (reader) => reader.nextBits(nBits);
}

export const fixedPoint16: Parser<number> = transform(uint16, (v) => v / 256);
