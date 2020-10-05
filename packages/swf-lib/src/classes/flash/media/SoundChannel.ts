import { Event } from "../events/Event";
import { EventDispatcher } from "../events/EventDispatcher";
import { SoundTransform } from "./SoundTransform";
import { Audio, globalVolumeNode } from "../../../internal/audio";
import { channels } from "./channels";

export class SoundChannel extends EventDispatcher {
  private __soundTransform: SoundTransform;
  private isStopped = false;
  private readonly __audioNode: AudioBufferSourceNode;
  private readonly __volumeNode: GainNode;
  private readonly __beginTime: number;
  private readonly __duration: number;

  constructor(
    buffer: AudioBuffer,
    soundTransform: SoundTransform,
    startTime: number,
    loops: number
  ) {
    super();

    this.__audioNode = Audio.createBufferSource();
    this.__volumeNode = Audio.createGain();
    this.__audioNode.buffer = buffer;
    this.__audioNode.connect(this.__volumeNode);
    this.__volumeNode.connect(globalVolumeNode);
    if (Audio.state === "suspended") {
      Audio.resume();
    }

    this.__soundTransform = soundTransform;
    this.__soundTransform.__source = this;
    this.__updateSoundTransform();

    const currentTime = Audio.currentTime;
    this.__beginTime = currentTime - startTime;
    this.__duration = buffer.duration;

    this.__audioNode.loop = true;
    this.__audioNode.loopStart = 0;
    this.__audioNode.start(currentTime, startTime);
    this.__audioNode.stop(
      this.__beginTime + Math.max(1, loops) * this.__duration
    );

    this.__audioNode.onended = () => {
      this.__volumeNode.disconnect();
      this.__audioNode.disconnect();
      channels.delete(this);
      if (!this.isStopped) {
        this.dispatchEvent(new Event(Event.SOUND_COMPLETE, false, false));
      }
    };

    channels.add(this);
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
    return ((Audio.currentTime - this.__beginTime) % this.__duration) * 1000;
  }

  stop() {
    this.isStopped = true;
    this.__audioNode.stop();
  }

  __updateSoundTransform() {
    this.__volumeNode.gain.setValueAtTime(
      this.__soundTransform.volume,
      Audio.currentTime
    );
  }
}
