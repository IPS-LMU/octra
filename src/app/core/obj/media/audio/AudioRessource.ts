import {MediaRessource} from '../MediaRessource';
import {SourceType} from '../index';
import {AudioInfo} from './AudioInfo';
import {isNullOrUndefined} from 'util';

export class AudioRessource extends MediaRessource {
  set info(value: AudioInfo) {
    this._info = value;
  }

  get info(): AudioInfo {
    return this._info;
  }

  private _info: AudioInfo;

  constructor(fullname: string, source: SourceType, info: AudioInfo, content?: any, size?: number) {
    super(fullname, source, content, size);

    if (!isNullOrUndefined(info.duration) && !isNullOrUndefined(info.duration) && info.duration.samples > 0 && info.samplerate > 0) {
      this._info = info;
    } else {
      throw Error('AudioRessource needs a correct instance of AudioInfo as parameter');
    }
  }
}
