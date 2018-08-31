import {AnnotJSONType, ISegment, OEvent, OItem, OLevel} from './AnnotJSON';
import {Segments} from './Segments';
import {OIDBLevel} from '../../shared/service/appstorage.service';

export class Level {
  public static counter = 1;
  public segments: Segments;
  public items: OItem[];
  public events: OEvent[];

  private _name: string;

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  private _type: AnnotJSONType;

  get type(): AnnotJSONType {
    return this._type;
  }

  private _id: number;

  get id(): number {
    return this._id;
  }

  constructor(id: number, name: string, type: string, segments?: Segments) {
    this._name = name;
    this._id = id;
    switch (type) {
      case('EVENT'):
        this._type = AnnotJSONType.EVENT;
        break;
      case('ITEM'):
        this._type = AnnotJSONType.ITEM;
        break;
      case('SEGMENT'):
        this._type = AnnotJSONType.SEGMENT;
        break;
    }

    if (!(segments === null || segments === undefined)) {
      this.segments = segments;
    }
  }

  public static fromObj(entry: OIDBLevel, samplerate: number, last_sample: number, sampleRateFactor: number): Level {
    if (!(sampleRateFactor === null || sampleRateFactor === undefined) && sampleRateFactor > 0) {
      console.log(`last samples ${last_sample}`);
      let segments: Segments = null;
      let events = [];
      let items = [];

      if (entry.level.type === 'SEGMENT') {
        const segment_entries: ISegment[] = <ISegment[]> entry.level.items;
        segments = new Segments(samplerate, segment_entries, last_sample, sampleRateFactor);
      } else if (entry.level.type === 'ITEM') {
        items = entry.level.items;
      } else if (entry.level.type === 'EVENT') {
        events = entry.level.items;
      }

      const result = new Level(entry.id, entry.level.name, entry.level.type, segments);
      result.items = items;
      result.events = events;

      return result;
    } else {
      throw new Error('can not load Level because sampleRateFactor is null!');
    }
  }

  public getObj(sampleRateFactor: number, lastOriginalSample: number): OLevel {
    let result: OLevel = null;
    if (this._type === AnnotJSONType.SEGMENT) {
      result = new OLevel(this._name, this.getTypeString(), this.segments.getObj(this._name, sampleRateFactor, lastOriginalSample));
    } else if (this._type === AnnotJSONType.ITEM) {
      result = new OLevel(this._name, this.getTypeString(), this.items);
    } else if (this._type === AnnotJSONType.EVENT) {
      result = new OLevel(this._name, this.getTypeString(), this.events);
    }
    this._type.toString();
    return result;
  }

  public getTypeString() {
    switch (this._type) {
      case(AnnotJSONType.EVENT):
        return 'EVENT';
      case(AnnotJSONType.ITEM):
        return 'ITEM';
      case(AnnotJSONType.SEGMENT):
        return 'SEGMENT';
    }
  }

  public clone(): Level {
    return new Level(++Level.counter, this.name + '_2', this.getTypeString(), this.segments.clone());
  }
}
