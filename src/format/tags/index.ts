import { Tag } from "../tag";
import { Reader } from "../../binary";

import { TagUnknown } from "./unknown";
import { EndTag } from "./end";
import { SetBackgroundColorTag } from "./set-background-color";
import { DoABCTag } from "./do-abc";
import { SymbolClassTag } from "./symbol-class";
import { FrameLabelTag } from "./frame-label";
import { DefineSceneAndFrameLabelDataTag } from "./define-scene-and-frame-label-data";

interface TagClass {
  new (reader: Reader): Tag;
  readonly code: number;
}
const tags = new Map<number, TagClass>();
function registerTag(cls: TagClass) {
  tags.set(cls.code, cls);
}

registerTag(EndTag);
registerTag(SetBackgroundColorTag);
registerTag(DoABCTag);
registerTag(SymbolClassTag);
registerTag(FrameLabelTag);
registerTag(DefineSceneAndFrameLabelDataTag);

export function parseTag(reader: Reader): Tag {
  const codeAndLength = reader.nextUInt16();
  const code = codeAndLength >>> 6;
  let length = codeAndLength & 0x3f;
  if (length === 0x3f) {
    length = reader.nextUInt32();
  }
  const body = reader.nextBuffer(length);

  const TagClass = tags.get(code);
  if (!TagClass) {
    return new TagUnknown(code, body);
  }

  return new TagClass(new Reader(body));
}
