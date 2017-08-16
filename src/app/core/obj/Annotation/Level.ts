import {AnnotJSONType, OLevel} from './AnnotJSON';
import {isNullOrUndefined} from 'util';
import {Segments} from './Segments';
import {OIDBLevel} from '../../shared/service/appstorage.service';

export class Level {
  get id(): number {
    return this._id;
  }

  set name(value: string) {
    this._name = value;
  }

  get name(): string {
    return this._name;
  }

  public static counter = 1;

  private _name: string;
  public segments: Segments;
  private type: AnnotJSONType;
  private _id: number;

  public static fromObj(entry: OIDBLevel, samplerate: number, last_sample: number): Level {
    const segments: Segments = new Segments(samplerate, entry.level.items, last_sample);
    const result = new Level(entry.id, entry.level.name, entry.level.type, segments);

    return result;
  }

  constructor(id: number, name: string, type: string, segments?: Segments) {
    this._name = name;
    this._id = id;
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
