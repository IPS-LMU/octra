import {MediaRessource} from '../MediaRessource';
import {SourceType} from '../index';
import {AudioInfo} from './AudioInfo';
import {isNullOrUndefined} from '../../../../core/shared/Functions';

export class AudioRessource extends MediaRessource {
  set objectURL(value: string) {
    this._objectURL = value;
  }
  get objectURL(): string {
    return this._objectURL;
  }
  private _info: AudioInfo;

  get info(): AudioInfo {
    return this._info;
  }

  set info(value: AudioInfo) {
    this._info = value;
  }

  private _objectURL: string;

  constructor(fullname: string, source: SourceType, info: AudioInfo, buffer?: ArrayBuffer, size?: number) {
    super(fullname, source, buffer, size);
    if (!(info.duration === null || info.duration === undefined)
      && !(info.samplerate === null || info.samplerate === undefined)
      && info.duration.browserSample.value > 0 && info.samplerate > 0) {
      this._info = info;
    } else {
      throw Error('AudioRessource needs a correct instance of AudioInfo as parameter');
    }

    if (!isNullOrUndefined(buffer)) {
      console.log(`CREATE OBJECT URL!`);
      this._objectURL = URL.createObjectURL(new File([buffer], fullname, {
        type: info.type
      }));
    }
  }
}
