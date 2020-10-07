import { Parser, object, uint32, uint16 } from "../../binary";

export interface SoundEnvelope {
  pos44: number;
  leftLevel: number;
  rightLevel: number;
}

export const soundEnvelope = object<SoundEnvelope>(
  ["pos44", uint32],
  ["leftLevel", uint16],
  ["rightLevel", uint16],
);

export interface SoundInfo {
  syncStop: boolean;
  syncNoMultiple: boolean;
  inPoint?: number;
  outPoint?: number;
  loopCount?: number;
  envelopes?: SoundEnvelope[];
}

export const soundInfo: Parser<SoundInfo> = (reader) => {
  reader.nextBits(2);
  const syncStop = reader.nextBitBool();
  const syncNoMultiple = reader.nextBitBool();
  const hasEnvelope = reader.nextBitBool();
  const hasLoops = reader.nextBitBool();
  const hasOutPoint = reader.nextBitBool();
  const hasInPoint = reader.nextBitBool();

  const info: SoundInfo = { syncStop, syncNoMultiple };
  if (hasInPoint) {
    info.inPoint = reader.nextUInt32();
  }
  if (hasOutPoint) {
    info.outPoint = reader.nextUInt32();
  }
  if (hasLoops) {
    info.loopCount = reader.nextUInt16();
  }
  if (hasEnvelope) {
    const envPoints = reader.nextUInt8();
    info.envelopes = new Array(envPoints);
    for (let i = 0; i < info.envelopes.length; i++) {
      info.envelopes[i] = soundEnvelope(reader);
    }
  }

  reader.flushBits();
  return info;
};
