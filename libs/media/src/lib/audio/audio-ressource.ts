import {AudioInfo} from './audio-info';
import {SourceType} from './index';
import {MediaRessource} from '../media-ressource';

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
    if (!(info.duration === null || info.duration === undefined)
      && !(info.sampleRate === null || info.sampleRate === undefined)
      && info.duration.samples > 0 && info.sampleRate > 0) {
      this._info = info;
    } else {
      throw Error('AudioRessource needs a correct instance of AudioInfo as parameter');
    }
  }
}
