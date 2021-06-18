import {AudioChunk, AudioTimeCalculator, SampleUnit} from '@octra/media';

export class PlayCursor {

  private readonly _innerWidth: number;

  private _absX: number;

  get absX(): number {
    return this._absX;
  }

  private _timePos: SampleUnit | undefined;

  get timePos(): SampleUnit | undefined {
    return this._timePos;
  }

  get relX(): number {
    // TODO INCORRECT
    return (this._innerWidth > 0) ? (this._absX % this._innerWidth) : 0;
  }

  constructor(absX: number, timePos: SampleUnit, innerWidth: number) {
    this._absX = absX;
    this._timePos = timePos;
    this._innerWidth = innerWidth;
  }

  public changeAbsX(absx: number, audioTCalculator: AudioTimeCalculator, audioPxWidth: number, chunk: AudioChunk) {
    this._absX = Math.max(0, Math.min(absx, audioPxWidth));
    this._timePos = audioTCalculator.absXChunktoSampleUnit(absx, chunk);
  }

  public changeSamples(sample: SampleUnit, audioTCalculator: AudioTimeCalculator, chunk?: AudioChunk) {
    this._timePos = sample.clone();
    const duration = (!(chunk === null || chunk === undefined) && chunk.time.start.samples < chunk.time.end.samples)
      ? chunk.time.end.sub(chunk.time.start) : undefined;

    this._absX = audioTCalculator.samplestoAbsX(sample, duration);
  }
}
