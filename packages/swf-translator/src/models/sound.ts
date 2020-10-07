export interface SoundEnvelope {
  pos44: number;
  leftLevel: number;
  rightLevel: number;
}

export interface SoundInfo {
  syncStop: boolean;
  syncNoMultiple: boolean;
  inPoint?: number;
  outPoint?: number;
  loopCount?: number;
  envelopes?: SoundEnvelope[];
}