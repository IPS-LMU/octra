import {IAnnotation, OAnnotation, OAudiofile} from '../../types/annotation';
import {isNullOrUndefined} from 'util';
import {Tier} from './Tier';
import {AppInfo} from '../../app.info';

export class Annotation {
  get annotator(): string {
    return this._annotator;
  }
  get version(): string {
    return this._version;
  }
  get date(): number {
    return this._date;
  }

  set date(value: number) {
    this._date = value;
  }
  get audiofile(): OAudiofile {
    return this._audiofile;
  }

  set audiofile(value: OAudiofile) {
    this._audiofile = value;
  }

  private _version: string;
  private _annotator: string;
  private _date: number;
  private _audiofile: OAudiofile;
  public tiers: Tier[];

  constructor(annotator: string, audiofile: OAudiofile, tiers?: Tier[]) {
    this._version = AppInfo.version;
    this._annotator = annotator;
    this._audiofile = audiofile;
    this.tiers = [];

    if (!isNullOrUndefined(tiers)) {
      this.tiers = tiers;
    }
  }

  public getObj(): OAnnotation {
    const result = new OAnnotation();
    result.version = this._version;
    result.annotator = this._annotator;
    const d: Date = new Date();
    result.date = d.toUTCString();
    result.audiofile = this._audiofile;

    for (let i = 0; i < this.tiers.length; i++) {
      const tier = this.tiers[i].getObj();
      result.tiers.push(tier);
    }

    return result;
  }
}
