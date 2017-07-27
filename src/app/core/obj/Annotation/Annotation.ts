import {OAnnotJSON, OAudiofile} from '../annotjson';
import {isNullOrUndefined} from 'util';
import {Level} from './Level';

export class Annotation {
  get annotates(): string {
    return this._annotates;
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

  private _annotates: string;
  private _date: number;
  private _audiofile: OAudiofile;
  public levels: Level[];

  constructor(annotates: string, audiofile: OAudiofile, levels?: Level[]) {
    this._annotates = annotates;
    this._audiofile = audiofile;
    this.levels = [];

    if (!isNullOrUndefined(levels)) {
      this.levels = levels;
    }
  }

  public getObj(): OAnnotJSON {
    const result = new OAnnotJSON(this._audiofile.name, this._audiofile.samplerate, []);
    result.annotates = this._annotates;
    result.sampleRate = this._audiofile.samplerate;

    for (let i = 0; i < this.levels.length; i++) {
      const level = this.levels[i].getObj();
      result.levels.push(level);
    }

    return result;
  }
}
