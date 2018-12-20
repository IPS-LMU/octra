import {MediaRessource} from '../MediaRessource';
import {SourceType} from '../index';
import {AudioInfo} from './AudioInfo';

export class AudioRessource extends MediaRessource {
  private _info: AudioInfo;

  get info(): AudioInfo {
    return this._info;
  }

  set info(value: AudioInfo) {
    this._info = value;
  }

  private _audiobuffer: AudioBuffer;

  get audiobuffer(): AudioBuffer {
    return this._audiobuffer;
  }

  set audiobuffer(value: AudioBuffer) {
    this._audiobuffer = value;
  }

  constructor(fullname: string, source: SourceType, info: AudioInfo, buffer?: ArrayBuffer, audiobuffer?: AudioBuffer, size?: number) {
    super(fullname, source, buffer, size);
    if (!(info.duration === null || info.duration === undefined)
      && !(info.samplerate === null || info.samplerate === undefined)
      && info.duration.browserSample.value > 0 && info.samplerate > 0) {
      this._info = info;
    } else {
      throw Error('AudioRessource needs a correct instance of AudioInfo as parameter');
    }
    this._audiobuffer = audiobuffer;
  }
}
