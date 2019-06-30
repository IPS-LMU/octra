import {BrowserAudioTime} from './AudioTime';
import {AudioChunk} from './AudioManager';

export class AudioTimeCalculator {
  set duration(value: BrowserAudioTime) {
    this._duration = value;
  }

  constructor(public samplerate: number,
              public _duration: BrowserAudioTime,
              public audioPxWidth: number) {
    if (this.audioPxWidth === null || this.audioPxWidth < 1) {
      console.error('audio px null');
    }
  }

  public static roundSamples(samples: number) {
    return Math.round(samples);
  }

  public samplestoAbsX(timeSamples: number, duration?: BrowserAudioTime): number {
    const dur = (duration) ? duration : this._duration;

    if (dur.browserSample.value === 0) {
      throw new Error('time duration must have samples greater 0');
    }

    return Math.round((timeSamples / dur.browserSample.value) * this.audioPxWidth);
  }

  public absXChunktoSamples(absX: number, chunk: AudioChunk): number {
    const start = (chunk.time.start) ? chunk.time.start.browserSample.value : 1;
    const duration = chunk.time.end.browserSample.value - start;
    if (absX >= 0 && absX <= this.audioPxWidth) {
      const ratio = absX / this.audioPxWidth;
      return AudioTimeCalculator.roundSamples((duration * ratio) + chunk.time.start.browserSample.value);
    }

    return -1;
  }

  public absXtoSamples2(absX: number, chunk: AudioChunk): number {
    const start = (chunk.time.start) ? chunk.time.start.browserSample.value : 1;
    const duration = chunk.time.end.browserSample.value - start;
    if (absX >= 0 && absX <= this.audioPxWidth) {
      const ratio = absX / this.audioPxWidth;

      return AudioTimeCalculator.roundSamples(duration * ratio);
    }

    return -1;
  }

  public samplesToSeconds(samples: number): number {
    return (this.samplerate > 0 && samples > -1) ? (samples / this.samplerate) : 0;
  }

  public secondsToSamples(seconds: number): number {
    return (this.samplerate > 0 && seconds > -1) ? AudioTimeCalculator.roundSamples(seconds * this.samplerate) : 0;
  }
}
