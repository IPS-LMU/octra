import {Logger} from '../shared/Logger';
import {decodeAudioFile} from 'browser-signal-processing/ts/browser-signal-processing/browser-api/format-conversion';

export class AudioInfo {
  get samplerate(): number {
    return this._samplerate;
  }

  get bitrate(): number {
    return this._bitrate;
  }

  get duration(): number {
    return this._duration;
  }

  private _samplerate: number;
  private _bitrate: number;
  private _duration: number;

  constructor(buffer: ArrayBuffer) {

  }

  public decodeAudio = (result: ArrayBuffer, callback: any = () => {
  }, errorcallback: (any) => void = () => {
  }): Promise<void> => {
    Logger.log('Decode audio...');
    this._samplerate = this.getSampleRate(result);
    this._bitrate = this.getBitRate(result);

    return decodeAudioFile(result, this._samplerate).then((buffer) => {
      this._duration = (buffer.length / this.samplerate);
    });
  }

  private getSampleRate(buf: ArrayBuffer): number {
    const bufferPart = buf.slice(24, 28);
    const bufferView = new Uint16Array(bufferPart);

    return bufferView[0];
  }

  public getBitRate(buf: ArrayBuffer): number {
    const bufferPart = buf.slice(34, 36);
    const bufferView = new Uint16Array(bufferPart);

    return bufferView[0];
  }
}

