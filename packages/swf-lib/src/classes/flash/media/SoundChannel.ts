import { Event } from "../events/Event";
import { EventDispatcher } from "../events/EventDispatcher";
import { Stage } from "../display/Stage";
import { SoundTransform } from "./SoundTransform";

export class SoundChannel extends EventDispatcher {
  private __soundTransform: SoundTransform;
  private isStopped = false;
  private readonly __context: AudioContext;
  private readonly __audioNode: AudioBufferSourceNode;
  private readonly __volumeNode: GainNode;
  private readonly __beginTime: number;
  private readonly __duration: number;

  constructor(
    stage: Stage,
    buffer: AudioBuffer,
    soundTransform: SoundTransform,
    startTime: number,
    loops: number
  ) {
    super();

    this.__context = stage.__audio.context;
    this.__audioNode = this.__context.createBufferSource();
    this.__volumeNode = this.__context.createGain();
    this.__audioNode.buffer = buffer;
    this.__audioNode.connect(this.__volumeNode);
    this.__volumeNode.connect(stage.__audio.rootNode);

    this.__soundTransform = soundTransform;
    this.__soundTransform.__source = this;
    this.__updateSoundTransform();

    const currentTime = this.__context.currentTime;
    this.__beginTime = currentTime - startTime;
    this.__duration = buffer.duration;

    this.__audioNode.loop = true;
    this.__audioNode.loopStart = 0;
    this.__audioNode.start(currentTime, startTime);
    this.__audioNode.stop(
      this.__beginTime + Math.min(Math.max(1, loops) * this.__duration, 1000000)
    );

    this.__audioNode.onended = stage.__withContext(() => {
      this.__volumeNode.disconnect();
      this.__audioNode.disconnect();
      if (!this.isStopped) {
        this.dispatchEvent(new Event(Event.SOUND_COMPLETE, false, false));
      }
    });
  }

  get soundTransform() {
    return this.__soundTransform;
  }

  set soundTransform(value) {
    this.__soundTransform.__source = null;
    this.__soundTransform = value;
    this.__soundTransform.__source = this;
    this.__updateSoundTransform();
  }

  get position(): number {
    return (
      ((this.__context.currentTime - this.__beginTime) % this.__duration) * 1000
    );
  }

  stop() {
    this.isStopped = true;
    this.__audioNode.stop();
  }

  __updateSoundTransform() {
    this.__volumeNode.gain.setValueAtTime(
      this.__soundTransform.volume,
      this.__context.currentTime
    );
  }
}
