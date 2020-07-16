import { Tag } from "../tag";
import { Reader, object, string, encodedU32 } from "../../binary";

export interface Scene {
  frameOffset: number;
  name: string;
}

const scene = object<Scene>(["frameOffset", encodedU32], ["name", string]);

export interface FrameLabel {
  frame: number;
  label: string;
}

const frameLabel = object<FrameLabel>(["frame", encodedU32], ["label", string]);

export class DefineSceneAndFrameLabelDataTag extends Tag {
  static readonly code = 86;

  constructor(reader: Reader) {
    super();
    const nScenes = encodedU32(reader);
    for (let i = 0; i < nScenes; i++) {
      this.scenes.push(scene(reader));
    }
    const nFrameLabels = encodedU32(reader);
    for (let i = 0; i < nFrameLabels; i++) {
      this.frameLabels.push(frameLabel(reader));
    }
  }

  readonly scenes: Scene[] = [];
  readonly frameLabels: FrameLabel[] = [];
}
