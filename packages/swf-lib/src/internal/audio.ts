const audioDecodeContext = new AudioContext();

export function decodeAudioData(data: ArrayBuffer) {
  return audioDecodeContext.decodeAudioData(data);
}

export class AudioController {
  readonly context = new AudioContext();
  rootNode: GainNode;

  constructor() {
    this.rootNode = this.context.createGain();
    this.rootNode.connect(this.context.destination);
  }

  reset() {
    this.rootNode.disconnect();
    this.rootNode = this.context.createGain();
    this.rootNode.connect(this.context.destination);
  }
}
