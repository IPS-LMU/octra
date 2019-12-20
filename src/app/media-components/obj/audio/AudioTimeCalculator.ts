import {AudioChunk} from './AudioManager';
import {SampleUnit} from './AudioTime';

export class AudioTimeCalculator {
  set duration(value: SampleUnit) {
    this._duration = value;
  }

  constructor(public _duration: SampleUnit,
              public audioPxWidth: number) {
    if (this.audioPxWidth === null || this.audioPxWidth < 1) {
      console.error('audio px null');
    }
  }

  public static roundSamples(samples: number) {
    return Math.round(samples);
  }

  public samplestoAbsX(timeSamples: SampleUnit, duration?: SampleUnit): number {
    const dur = (duration) ? duration : this._duration;

    if (dur.samples === 0) {
      throw new Error('time duration must have samples greater 0');
    }

    return Math.round((timeSamples.samples / dur.samples) * this.audioPxWidth);
  }

  public absXChunktoSampleUnit(absX: number, chunk: AudioChunk): SampleUnit | null {
    const start = (chunk.time.start) ? chunk.time.start.samples : 1;
    const duration = chunk.time.end.samples - start;
    if (absX >= 0 && absX <= this.audioPxWidth) {
      const ratio = absX / this.audioPxWidth;
      return new SampleUnit(AudioTimeCalculator.roundSamples((duration * ratio) + chunk.time.start.samples)
        , chunk.sampleRate);
    }

    return null;
  }

  public absXtoSamples2(absX: number, chunk: AudioChunk): number {
    const start = (chunk.time.start) ? chunk.time.start.samples : 1;
    const duration = chunk.time.end.samples - start;
    if (absX >= 0 && absX <= this.audioPxWidth) {
      const ratio = absX / this.audioPxWidth;

      return AudioTimeCalculator.roundSamples(duration * ratio);
    }

    return -1;
  }

  public samplesToSeconds(samples: number): number {
    return (this._duration.sampleRate > 0 && samples > -1) ? (samples / this._duration.sampleRate) : 0;
  }

  public secondsToSamples(seconds: number): number {
    return (this._duration.sampleRate > 0 && seconds > -1) ? AudioTimeCalculator.roundSamples(seconds * this._duration.sampleRate) : 0;
  }
}
