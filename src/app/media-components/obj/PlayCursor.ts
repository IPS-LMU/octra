import {AudioChunk, AudioTimeCalculator, BrowserAudioTime} from './media/audio';

export class PlayCursor {

  private readonly _innerWidth: number;

  private _absX: number;

  get absX(): number {
    return this._absX;
  }

  private readonly _time_pos: BrowserAudioTime;

  get time_pos(): BrowserAudioTime {
    return this._time_pos;
  }

  get relX(): number {
    // TODO INCORRECT
    return (this._innerWidth > 0) ? (this._absX % this._innerWidth) : 0;
  }

  constructor(absX: number, time_pos: BrowserAudioTime, innerWidth: number) {
    this._absX = absX;
    this._time_pos = time_pos;
    this._innerWidth = innerWidth;
  }

  public changeAbsX(absx: number, audioTCalculator: AudioTimeCalculator, audio_px_width: number, chunk: AudioChunk) {
    this._absX = Math.max(0, Math.min(absx, audio_px_width));
    this._time_pos.browserSample.value = audioTCalculator.absXChunktoSamples(absx, chunk);
  }

  public changeSamples(samples: number, audioTCalculator: AudioTimeCalculator, chunk?: AudioChunk) {
    this._time_pos.browserSample.value = samples;
    const duration = (!(chunk === null || chunk === undefined) && chunk.time.start.browserSample.value < chunk.time.end.browserSample.value)
      ? new BrowserAudioTime(chunk.time.end.browserSample.sub(chunk.time.start.browserSample), audioTCalculator.samplerate) : null;

    const chunk_s = ((chunk) ? (chunk.time.start.browserSample.value) : 0);
    this._absX = audioTCalculator.samplestoAbsX(samples - chunk_s, duration);
  }
}
