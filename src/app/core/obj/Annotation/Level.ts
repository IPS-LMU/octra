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
  private type: AnnotJSONType;

  public static fromObj(level: OLevel, samplerate: number, last_sample: number): Level {
    const segments: Segments = new Segments(samplerate, level.items, last_sample);
    const result = new Level(level.name, level.type, segments);

    return result;
  }

  constructor(name: string, type: string, segments?: Segments) {
    this._name = name;

    switch (type) {
      case('EVENT'):
        this.type = AnnotJSONType.EVENT;
        break;
      case('ITEM'):
        this.type = AnnotJSONType.ITEM;
        break;
      case('SEGMENT'):
        this.type = AnnotJSONType.SEGMENT;
        break;
    }

    if (!isNullOrUndefined(segments)) {
      this.segments = segments;
    }
  }

  public getObj(): OLevel {
    const result: OLevel = new OLevel(this._name, this.getTypeString(), this.segments.getObj(this._name));
    this.type.toString();
    return result;
  }

  public getTypeString() {
    switch (this.type) {
      case(AnnotJSONType.EVENT):
        return 'EVENT';
      case(AnnotJSONType.ITEM):
        return 'ITEM';
      case(AnnotJSONType.SEGMENT):
        return 'SEGMENT';
    }
  }
}
