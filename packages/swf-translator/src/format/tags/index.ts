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
import { DefineSpriteTag } from "./define-sprite";
import { ShowFrameTag } from "./show-frame";
import { PlaceObject2Tag } from "./place-object-2";
import { PlaceObject3Tag } from "./place-object-3";
import { RemoveObject2Tag } from "./remove-object-2";
import { DefineFont3Tag } from "./define-font-3";
import { DefineTextTag } from "./define-text";
import { DefineText2Tag } from "./define-text-2";
import { DefineEditTextTag } from "./define-edit-text";
import { DefineMorphShapeTag } from "./define-morph-shape";
import { DefineButton2Tag } from "./define-button-2";

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
registerTag(DefineSpriteTag);
registerTag(ShowFrameTag);
registerTag(PlaceObject2Tag);
registerTag(PlaceObject3Tag);
registerTag(RemoveObject2Tag);
registerTag(DefineFont3Tag);
registerTag(DefineTextTag);
registerTag(DefineText2Tag);
registerTag(DefineEditTextTag);
registerTag(DefineMorphShapeTag);
registerTag(DefineButton2Tag);

function parseTag(reader: Reader): Tag {
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

export function parseTags(reader: Reader): Tag[] {
  const tags: Tag[] = [];
  let tag: Tag;
  do {
    tag = parseTag(reader);
    tags.push(tag);
  } while (tag.code !== 0);
  return tags;
}
