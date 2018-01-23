import {AudioTime} from './AudioTime';
import {AudioChunk} from './AudioChunk';

export class AudioTimeCalculator {
  public static roundSamples(samples: number) {
    return Math.round(samples);
  }

  constructor(public samplerate: number,
              public _duration: AudioTime,
              public audio_px_width: number) {
    if (this.audio_px_width === null || this.audio_px_width < 1) {
      console.error('audio px null');
    }
  }

  set duration(value: AudioTime) {
    this._duration = value;
  }

  public samplestoAbsX(time_samples: number, duration?: AudioTime): number {
    const dur = (duration) ? duration : this._duration;

    if (dur.samples === 0) {
      throw new Error('time duration must have samples greater 0');
    }

    return (time_samples / dur.samples) * this.audio_px_width;
  }

  public absXChunktoSamples(absX: number, chunk: AudioChunk): number {
    const start = (chunk.time.start) ? chunk.time.start.samples : 1;
    const duration = chunk.time.end.samples - start;
    if (absX >= 0 && absX <= this.audio_px_width) {
      const ratio = absX / this.audio_px_width;
      return AudioTimeCalculator.roundSamples((duration * ratio) + chunk.time.start.samples);
    }

    return -1;
  }

  public absXtoSamples2(absX: number, chunk: AudioChunk): number {
    const start = (chunk.time.start) ? chunk.time.start.samples : 1;
    const duration = chunk.time.end.samples - start;
    if (absX >= 0 && absX <= this.audio_px_width) {
      const ratio = absX / this.audio_px_width;

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
