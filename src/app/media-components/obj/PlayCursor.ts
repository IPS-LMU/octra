import {AudioTimeCalculator, BrowserAudioTime} from './media/audio';
import {AudioChunk} from './media/audio/AudioManager';

export class PlayCursor {

  private readonly _innerWidth: number;

  private _absX: number;

  get absX(): number {
    return this._absX;
  }

  private readonly _timePos: BrowserAudioTime;

  get timePos(): BrowserAudioTime {
    return this._timePos;
  }

  get relX(): number {
    // TODO INCORRECT
    return (this._innerWidth > 0) ? (this._absX % this._innerWidth) : 0;
  }

  constructor(absX: number, timePos: BrowserAudioTime, innerWidth: number) {
    this._absX = absX;
    this._timePos = timePos;
    this._innerWidth = innerWidth;
  }

  public changeAbsX(absx: number, audioTCalculator: AudioTimeCalculator, audioPxWidth: number, chunk: AudioChunk) {
    this._absX = Math.max(0, Math.min(absx, audioPxWidth));
    this._timePos.browserSample.value = audioTCalculator.absXChunktoSamples(absx, chunk);
  }

  public changeSamples(samples: number, audioTCalculator: AudioTimeCalculator, chunk?: AudioChunk) {
    this._timePos.browserSample.value = samples;
    const duration = (!(chunk === null || chunk === undefined) && chunk.time.start.browserSample.value < chunk.time.end.browserSample.value)
      ? new BrowserAudioTime(chunk.time.end.browserSample.sub(chunk.time.start.browserSample), audioTCalculator.samplerate) : null;

    const chunkS = ((chunk) ? (chunk.time.start.browserSample.value) : 0);
    this._absX = audioTCalculator.samplestoAbsX(samples - chunkS, duration);
  }
}
