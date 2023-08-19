import {
  AnnotationLevelType,
  ISegment,
  OEvent,
  OItem,
  OLevel,
} from './annotjson';
import { SampleUnit } from '@octra/media';
import { OIDBLevel } from './db-objects';
import { Segment } from './segment';
import {
  addSegment,
  convertOSegmentsToSegments,
  convertSegmentsToOSegments,
} from './functions';

export class Level {
  public counter = 1;
  public segments: Segment[] = [];
  public items!: OItem[];
  public events!: OEvent[];
  private readonly _type!: AnnotationLevelType;
  private readonly _id: number;

  private _name: string;

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get type(): AnnotationLevelType {
    return this._type;
  }

  get id(): number {
    return this._id;
  }

  constructor(id: number, name: string, type: string, segments?: Segment[]) {
    this._name = name;
    this._id = id;
    switch (type) {
      case 'EVENT':
        this._type = AnnotationLevelType.EVENT;
        break;
      case 'ITEM':
        this._type = AnnotationLevelType.ITEM;
        break;
      case 'SEGMENT':
        this._type = AnnotationLevelType.SEGMENT;
        break;
    }

    if (segments) {
      this.segments = segments;
    }
  }

  public static fromObj(
    entry: OIDBLevel,
    sampleRate: number,
    lastSample: SampleUnit
  ): Level {
    let segments: Segment[] = [];
    let events: any[] = [];
    let items: any[] = [];

    if (entry.level.type === 'SEGMENT') {
      const segmentEntries: ISegment[] = entry.level.items as ISegment[];
      segments = convertOSegmentsToSegments(
        entry.level.name,
        segmentEntries,
        lastSample
      );
    } else if (entry.level.type === 'ITEM') {
      items = entry.level.items;
    } else if (entry.level.type === 'EVENT') {
      events = entry.level.items;
    }

    const result = new Level(
      entry.id,
      entry.level.name,
      entry.level.type,
      segments
    );
    result.items = items;
    result.events = events;

    return result;
  }

  public getObj(lastOriginalBoundary: SampleUnit): OLevel | undefined {
    let result: OLevel | undefined = undefined;
    if (this._type === AnnotationLevelType.SEGMENT) {
      result = new OLevel(
        this._name,
        this.getTypeString(),
        convertSegmentsToOSegments(
          this._name,
          this.segments,
          lastOriginalBoundary.samples
        )
      );
    } else if (this._type === AnnotationLevelType.ITEM) {
      result = new OLevel(this._name, this.getTypeString(), this.items);
    } else if (this._type === AnnotationLevelType.EVENT) {
      result = new OLevel(this._name, this.getTypeString(), this.events);
    }
    this._type.toString();
    return result;
  }

  public getTypeString() {
    return this._type;
  }

  public addSegment(
    time: SampleUnit,
    label = '',
    transcript: string | undefined = undefined
  ) {
    const newLabel = label !== '' ? label : this._name;
    this.segments = addSegment(this.segments, time, newLabel, transcript);
  }

  public createSegment(time: SampleUnit, transcript = '') {
    return new Segment(time, this._name, transcript);
  }

  public clone(): Level {
    return new Level(++this.counter, this.name + '_2', this.getTypeString(), [
      ...this.segments,
    ]);
  }
}
