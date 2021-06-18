import {OAnnotJSON, OAudiofile} from './annotjson';
import {Level} from './level';
import {Link} from './link';
import {SampleUnit} from '@octra/media';

export class Annotation {
  private readonly _annotates: string;
  private readonly _levels: Level[];

  get annotates(): string {
    return this._annotates;
  }

  private _audiofile: OAudiofile;

  get audiofile(): OAudiofile {
    return this._audiofile;
  }

  set audiofile(value: OAudiofile) {
    this._audiofile = value;
  }

  get levels(): Level[] {
    return this._levels;
  }

  private _links: Link[];

  get links(): Link[] {
    return this._links;
  }

  set links(value: Link[]) {
    this._links = value;
  }

  constructor(annotates: string, audiofile: OAudiofile, levels?: Level[], links?: Link[]) {
    this._annotates = annotates;
    this._audiofile = audiofile;
    this._levels = [];
    this._links = [];

    if (!(levels === undefined || levels === undefined)) {
      this._levels = levels;
    }
    if (!(links === undefined || links === undefined)) {
      this._links = links;
    }
  }

  public getObj(lastOriginalBoundary: SampleUnit): OAnnotJSON {
    const result = new OAnnotJSON(this._audiofile.name, this._audiofile.sampleRate, [], this._links);
    result.annotates = this._annotates;

    let startID = 1;
    for (const level of this.levels) {
      const oLevel = level.getObj(lastOriginalBoundary);

      for (const item of oLevel.items) {
        item.id = startID++;
        if (!(item.labels === undefined || item.labels === undefined) && item.labels.length > 0) {
          if (item.labels[0].name === '') {
            item.labels[0].name = oLevel.name;
          }
        }
      }
      result.levels.push(oLevel);
    }
    return result;
  }
}
