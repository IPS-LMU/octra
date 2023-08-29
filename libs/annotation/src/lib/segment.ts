import { ISegment, OEvent, OItem, OLabel, OSegment } from './annotjson';
import { SampleUnit } from '@octra/media';
import { Serializable } from '@octra/utilities';
import { ASRQueueItemType } from './asr';

export interface SegmentWithContext<T extends ASRContext> {
  id: number;
  labels: OLabel[];
  time: SampleUnit;
  context?: T;
}

export interface ASRContext {
  asr?: {
    isBlockedBy?: ASRQueueItemType;
    progressInfo?: { progress: number; statusLabel: string };
  };
}

export class Segment<T extends ASRContext = ASRContext>
  implements
    SegmentWithContext<T>,
    Serializable<SegmentWithContext<T>, Segment<T>>
{
  get id(): number {
    return this._id;
  }

  public context?: T;
  public time: SampleUnit;

  private _id: number;
  public labels: OLabel[];

  constructor(id: number, time: SampleUnit, labels?: OLabel[], context?: T) {
    this.time = time;
    this._id = id;
    this.labels = labels ?? [];
    this.context = context;
  }

  serialize(): SegmentWithContext<T> {
    return {
      id: this.id,
      time: this.time,
      labels: this.labels,
      context: this.context,
    };
  }

  serializeToOSegment(sampleStart: number): OSegment {
    return new OSegment(
      this.id,
      sampleStart,
      this.time.samples - sampleStart,
      this.labels
    );
  }

  deserialize(jsonObject: SegmentWithContext<T>): Segment<T> {
    return Segment.deserialize(jsonObject);
  }

  getLabel(name: string) {
    return this.labels?.find((a) => a.name === name);
  }

  getFirstLabelWithoutName(notName: string) {
    return this.labels?.find((a) => a.name !== notName);
  }

  changeLabel(name: string, value: string) {
    const index = this.labels.findIndex((a) => a.name === name);
    if (index > -1) {
      this.labels[index].value = value;
      return true;
    }
    return false;
  }

  changeFirstLabelWithoutName(notName: string, value: string) {
    const index = this.labels.findIndex((a) => a.name !== notName);
    if (index > -1) {
      this.labels[index].value = value;
      return true;
    }
    return false;
  }

  static deserialize<T extends ASRContext>(
    jsonObject: SegmentWithContext<T>
  ): Segment<T> {
    const result = new Segment<T>(
      jsonObject.id,
      jsonObject.time,
      jsonObject.labels.map((a) => OLabel.deserialize(a)),
      jsonObject.context
    );
    return result;
  }

  static deserializeFromOSegment<T extends ASRContext>(
    jsonObject: ISegment,
    sampleRate: number,
    context?: T
  ): Segment<T> {
    return new Segment<T>(
      jsonObject.id,
      new SampleUnit(jsonObject.sampleStart + jsonObject.sampleDur, sampleRate),
      jsonObject.labels.map((a) => OLabel.deserialize(a)),
      context
    );
  }

  clone(id: number): Segment<T> {
    return new Segment<T>(id, this.time, this.labels, this.context);
  }
}

export type AnnotationAnySegment = Segment<ASRContext> | OItem | OEvent;
