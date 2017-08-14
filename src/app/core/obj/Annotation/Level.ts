import {AnnotJSONType, OLevel} from './AnnotJSON';
import {isNullOrUndefined} from 'util';
import {Segments} from './Segments';

export class Level {
  set name(value: string) {
    this._name = value;
  }
  get name(): string {
    return this._name;
  }
  private _name: string;
  public segments: Segments;
  private type: AnnotJSONType = AnnotJSONType.SEGMENT;

  public static fromObj(level: OLevel, samplerate: number, last_sample: number): Level {
    const segments: Segments = new Segments(samplerate, level.items, last_sample);
    const result = new Level(level.name, segments);

    return result;
  }

  constructor(name: string, segments?: Segments) {
    this._name = name;

    if (!isNullOrUndefined(segments)) {
      this.segments = segments;
    }
  }

  public getObj(): OLevel {
    const result: OLevel = new OLevel(this._name, 'SEGMENT', this.segments.getObj(this._name));
    this.type.toString();
    return result;
  }
}
