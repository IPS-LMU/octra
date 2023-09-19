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

export class OctraAnnotationEvent
  implements Serializable<OctraAnnotationEvent, OctraAnnotationEvent>
{
  id!: number;
  samplePoint!: SampleUnit;
  labels: OLabel[] = [];

  constructor(id: number, samplePoint: SampleUnit, labels?: OLabel[]) {
    this.id = id;
    this.samplePoint = samplePoint;
    this.labels = labels ?? [];
  }

  serialize(): OctraAnnotationEvent {
    return new OctraAnnotationEvent(this.id, this.samplePoint, this.labels);
  }

  deserialize(jsonObject: OctraAnnotationEvent): OctraAnnotationEvent {
    return OctraAnnotationEvent.deserialize(jsonObject);
  }

  static deserialize<T extends ASRContext>(
    jsonObject: OctraAnnotationEvent
  ): OctraAnnotationEvent {
    return jsonObject;
  }

  clone(id?: number) {
    return new OctraAnnotationEvent(id ?? this.id, this.samplePoint.clone(), [
      ...this.labels,
    ]);
  }

  getFirstLabelWithoutName(notName: string) {
    return this.labels?.find((a) => a.name !== notName);
  }
}

export class OctraAnnotationSegment<T extends ASRContext = ASRContext>
  implements
    SegmentWithContext<T>,
    Serializable<SegmentWithContext<T>, OctraAnnotationSegment<T>>
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

  deserialize(jsonObject: SegmentWithContext<T>): OctraAnnotationSegment<T> {
    return OctraAnnotationSegment.deserialize(jsonObject);
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
      this.labels = [
        ...this.labels.slice(0, index),
        new OLabel(this.labels[index].name, value),
        ...this.labels.slice(index + 1),
      ];
      return true;
    }
    return false;
  }

  changeFirstLabelWithoutName(notName: string, value: string) {
    const index = this.labels.findIndex((a) => a.name !== notName);
    if (index > -1) {
      this.labels = [
        ...this.labels.slice(0, index),
        new OLabel(this.labels[index].name, value),
        ...this.labels.slice(index + 1),
      ];
      return true;
    }
    return false;
  }

  static deserialize<T extends ASRContext>(
    jsonObject: SegmentWithContext<T>
  ): OctraAnnotationSegment<T> {
    const result = new OctraAnnotationSegment<T>(
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
  ): OctraAnnotationSegment<T> {
    return new OctraAnnotationSegment<T>(
      jsonObject.id,
      new SampleUnit(jsonObject.sampleStart + jsonObject.sampleDur, sampleRate),
      jsonObject.labels.map((a) => OLabel.deserialize(a)),
      context
    );
  }

  clone(id?: number): OctraAnnotationSegment<T> {
    return new OctraAnnotationSegment<T>(
      id ?? this._id,
      this.time,
      [...this.labels],
      {
        ...this.context,
      } as any
    );
  }
}

export type AnnotationAnySegment =
  | OctraAnnotationSegment<ASRContext>
  | OItem
  | OEvent;
