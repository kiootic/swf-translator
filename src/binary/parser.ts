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
export const string: Parser<string> = (reader) => reader.nextString();

export function fixedString(length: number): Parser<string> {
  return (reader) => reader.nextFixedString(length);
}

export function ubits(nBits: number): Parser<number> {
  return (reader) => reader.nextBits(nBits);
}

export const fixedPoint16: Parser<number> = transform(uint16, (v) => v / 256);

export function encodedU32(reader: Reader): number {
  let result = reader.nextUInt8();
  if (!(result & 0x0000_0080)) {
    return result;
  }

  result = (result & 0x0000_007f) | (reader.nextUInt8() << 7);
  if (!(result & 0x0000_4000)) {
    return result;
  }

  result = (result & 0x0000_3fff) | (reader.nextUInt8() << 14);
  if (!(result & 0x0020_0000)) {
    return result;
  }

  result = (result & 0x001f_ffff) | (reader.nextUInt8() << 21);
  if (!(result & 0x1000_0000)) {
    return result;
  }

  result = (result & 0x0fff_ffff) | (reader.nextUInt8() << 28);
  return result;
}
