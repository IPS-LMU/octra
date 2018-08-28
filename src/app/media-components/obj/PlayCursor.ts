import {AudioChunk, AudioTime, AudioTimeCalculator} from './media/audio';

export class PlayCursor {

  private _innerWidth: number;

  private _absX: number;

  get absX(): number {
    return this._absX;
  }

  private _time_pos: AudioTime;

  get time_pos(): AudioTime {
    return this._time_pos;
  }

  get relX(): number {
    // TODO INCORRECT
    return (this._innerWidth > 0) ? (this._absX % this._innerWidth) : 0;
  }

  constructor(absX: number, time_pos: AudioTime, innerWidth: number) {
    this._absX = absX;
    this._time_pos = time_pos;
    this._innerWidth = innerWidth;
  }

  public changeAbsX(absx: number, audioTCalculator: AudioTimeCalculator, audio_px_width: number, chunk: AudioChunk) {
    this._absX = Math.max(0, Math.min(absx, audio_px_width));
    this._time_pos.samples = audioTCalculator.absXChunktoSamples(absx, chunk);
  }

  public changeSamples(samples: number, audioTCalculator: AudioTimeCalculator, chunk?: AudioChunk) {
    this._time_pos.samples = samples;
    const duration = (!(chunk === null || chunk === undefined) && chunk.time.start.samples < chunk.time.end.samples)
      ? new AudioTime(chunk.time.end.samples - chunk.time.start.samples, audioTCalculator.samplerate) : null;

    const chunk_s = ((chunk) ? (chunk.time.start.samples) : 0);
    this._absX = audioTCalculator.samplestoAbsX(samples - chunk_s, duration);
  }
}
