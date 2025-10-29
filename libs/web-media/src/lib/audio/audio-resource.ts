import { OAudiofile } from '@octra/media';
import { MediaResource } from '../media-resource';
import { SourceType } from '../types';
import { AudioInfo } from './audio-info';

export class AudioResource extends MediaResource {
  private _info: AudioInfo<any>;

  get info(): AudioInfo<any> {
    return this._info;
  }

  set info(value: AudioInfo<any>) {
    this._info = value;
  }

  constructor(
    fullname: string,
    source: SourceType,
    info: AudioInfo<any>,
    buffer?: ArrayBuffer,
    size?: number,
    url?: string,
  ) {
    super(fullname, source, buffer, size, url);
    if (
      info.duration &&
      info.sampleRate &&
      info.duration.samples > 0 &&
      info.sampleRate > 0
    ) {
      this._info = info;
    } else {
      throw Error(
        'AudioResource needs a correct instance of AudioInfo as parameter',
      );
    }
  }

  getOAudioFile(): OAudiofile {
    const result = new OAudiofile();
    result.type = this._info.type;
    result.duration = this._info.duration.samples;
    result.size = this.size ?? 0;
    result.url = this._info.url;
    result.name = this._info.fullname;
    result.arraybuffer = this.arraybuffer;
    result.sampleRate = this._info.sampleRate;

    return result;
  }
}
