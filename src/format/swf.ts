import { inflateSync } from "zlib";
import {
  object,
  fixedString,
  uint8,
  uint32,
  Reader,
  fixedPoint16,
  uint16,
} from "../binary";
import { Rect, rect } from "./structs";
import { Tag } from "./tag";
import { parseTag } from "./tags";

interface SWFHeader1 {
  sig: string;
  version: number;
  length: number;
}

const parserHeader1 = object<SWFHeader1>(
  ["sig", fixedString(3)],
  ["version", uint8],
  ["length", uint32]
);

interface SWFHeader2 {
  frameSize: Rect;
  frameRate: number;
  frameCount: number;
}

const parserHeader2 = object<SWFHeader2>(
  ["frameSize", rect],
  ["frameRate", fixedPoint16],
  ["frameCount", uint16]
);

export class SWFFile {
  readonly version: number;
  readonly frameSize: Rect;
  readonly frameRate: number;
  readonly frameCount: number;
  readonly tags: Tag[] = [];
  readonly characters = new Map<number, Tag>();

  constructor(buf: Buffer) {
    const header1 = parserHeader1(new Reader(buf));
    this.version = header1.version;

    let body: Buffer;
    switch (header1.sig) {
      case "CWS":
        body = inflateSync(buf.slice(8));
        break;
      default:
        throw new Error(`Unsupported signature: ${header1.sig}`);
    }
    if (header1.length !== body.length + 8) {
      throw new Error(
        `Mismatched length: ${header1.length} != ${body.length + 8}`
      );
    }

    const bodyReader = new Reader(body);
    const header2 = parserHeader2(bodyReader);
    this.frameSize = header2.frameSize;
    this.frameRate = header2.frameRate;
    this.frameCount = header2.frameCount;

    let tag: Tag;
    do {
      tag = parseTag(bodyReader);
      if (tag.characterId) {
        this.characters.set(tag.characterId, tag);
      }
      this.tags.push(tag);
    } while (tag.code !== 0);
  }
}
