import {MediaRessource} from '../MediaRessource';
import {SourceType} from '../index';
import {AudioInfo} from './AudioInfo';
import {isNullOrUndefined} from 'util';

export class AudioRessource extends MediaRessource {
  get audiobuffer(): AudioBuffer {
    return this._audiobuffer;
  }

  set info(value: AudioInfo) {
    this._info = value;
  }

  get info(): AudioInfo {
    return this._info;
  }

  private _info: AudioInfo;
  private _audiobuffer: AudioBuffer

  constructor(fullname: string, source: SourceType, info: AudioInfo, buffer?: ArrayBuffer, audiobuffer?: AudioBuffer, size?: number) {
    super(fullname, source, buffer, size);
    if (!isNullOrUndefined(info.duration) && !isNullOrUndefined(info.duration) && info.duration.samples > 0 && info.samplerate > 0) {
      this._info = info;
    } else {
      throw Error('AudioRessource needs a correct instance of AudioInfo as parameter');
    }
    this._audiobuffer = audiobuffer;
      }
}
