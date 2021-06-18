import {AudioInfo} from './audio-info';
import {MediaRessource} from '../media-ressource';
import {SourceType} from '../types';

export class AudioRessource extends MediaRessource {
  private _info: AudioInfo;

  get info(): AudioInfo {
    return this._info;
  }

  set info(value: AudioInfo) {
    this._info = value;
  }

  constructor(fullname: string, source: SourceType, info: AudioInfo, buffer?: ArrayBuffer, size?: number) {
    super(fullname, source, buffer, size);
    if (!(info.duration === undefined || info.duration === undefined)
      && !(info.sampleRate === undefined || info.sampleRate === undefined)
      && info.duration.samples > 0 && info.sampleRate > 0) {
      this._info = info;
    } else {
      throw Error('AudioRessource needs a correct instance of AudioInfo as parameter');
    }
  }
}
