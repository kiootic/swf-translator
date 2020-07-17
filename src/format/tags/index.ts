import { Tag } from "../tag";
import { Reader } from "../../binary";

import { UnknownTag } from "./unknown";
import { EndTag } from "./end";
import { SetBackgroundColorTag } from "./set-background-color";
import { DoABCTag } from "./do-abc";
import { SymbolClassTag } from "./symbol-class";
import { FrameLabelTag } from "./frame-label";
import { DefineSceneAndFrameLabelDataTag } from "./define-scene-and-frame-label-data";
import { DefineBitsTag } from "./define-bits";
import { DefineBitsJPEG2Tag } from "./define-bits-jpeg-2";
import { DefineBitsJPEG3Tag } from "./define-bits-jpeg-3";
import { DefineBitsLossless2Tag } from "./define-bits-loseless-2";
import { DefineSoundTag } from "./define-sound";
import { DefineShapeTag } from "./define-shape";
import { DefineShape2Tag } from "./define-shape-2";
import { DefineShape3Tag } from "./define-shape-3";
import { DefineShape4Tag } from "./define-shape-4";

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
registerTag(DefineBitsTag);
registerTag(DefineBitsJPEG2Tag);
registerTag(DefineBitsJPEG3Tag);
registerTag(DefineBitsLossless2Tag);
registerTag(DefineSoundTag);
registerTag(DefineShapeTag);
registerTag(DefineShape2Tag);
registerTag(DefineShape3Tag);
registerTag(DefineShape4Tag);

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
    return new UnknownTag(code, body);
  }

  return new TagClass(new Reader(body));
}
