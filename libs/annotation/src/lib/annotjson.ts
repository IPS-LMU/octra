import { last, Serializable } from '@octra/utilities';

export interface IAnnotJSON {
  name: string;
  annotates: string;
  sampleRate: number;
  levels: ILevel[];
  links: ILink[];
}

export interface ILevel {
  name: string;
  type: AnnotationLevelType;
}

export interface ISegmentLevel extends ILevel {
  items: ISegment[];
}

export interface IItemLevel extends ILevel {
  items: IItem[];
}

export interface IEventLevel extends ILevel {
  items: IEvent[];
}

export type IAnyLevel = ISegmentLevel | IItemLevel | IEventLevel;

export interface IItem {
  id: number;
  labels: ILabel[];
}

export interface ISegment extends IItem {
  sampleStart: number;
  sampleDur: number;
}

export interface IEvent extends IItem {
  samplePoint: number;
}

export interface ILabel {
  name: string;
  value: string;
}

export interface ILink {
  fromID: number;
  toID: number;
}

export interface IAudioFile {
  name: string;
  sampleRate: number;
  duration?: number;
  size?: number;
  arraybuffer?: ArrayBuffer;
  url?: string;
  type?: string;
}

/*
 CLASSES
 Classes that are just container to build their interfaces
 */

export class OAnnotJSON
  implements IAnnotJSON, Serializable<IAnnotJSON, OAnnotJSON>
{
  /**
   * name of the annotation file WITHOUT extension
   */
  name = '';
  annotates = '';
  sampleRate;
  levels: OAnyLevel<OSegment>[] = [];
  links: OLink[] = [];

  get maxItemID(): number {
    return Math.max(
      1,
      ...this.levels.map((a) => {
        return Math.max(1, ...a.items.map((a) => a.id));
      })
    );
  }

  get maxLevelID(): number {
    return Math.max(1, last(this.levels.map((a, i) => i + 1))!);
  }

  /**
   * initiates a new AnnotJSON object
   * @param annotates
   * @param name file name WITHOUT extension
   * @param sampleRate
   * @param levels
   * @param links
   */
  constructor(
    annotates: string,
    name: string,
    sampleRate: number,
    levels?: ILevel[],
    links?: ILink[]
  ) {
    this.annotates = annotates;
    this.name = name;
    this.sampleRate = sampleRate;

    if (levels) {
      this.levels = levels.map((a) => {
        if (a.type === AnnotationLevelType.SEGMENT) {
          return OSegmentLevel.deserialize(a as ISegmentLevel);
        } else if (a.type === AnnotationLevelType.EVENT) {
          return OEventLevel.deserialize(a as IEventLevel);
        }
        return OItemLevel.deserialize(a as IItemLevel);
      });
    }

    if (links) {
      this.links = links.map((a) => OLink.deserialize(a));
    }
  }

  serialize(): IAnnotJSON {
    return {
      annotates: this.annotates,
      levels: this.levels.map((a) => a.serialize()),
      links: this.links.map((a) => a.serialize()),
      name: this.name,
      sampleRate: this.sampleRate,
    };
  }

  static deserialize(jsonObject: IAnnotJSON): OAnnotJSON | undefined {
    if (jsonObject) {
      return new OAnnotJSON(
        jsonObject.annotates,
        jsonObject.name,
        jsonObject.sampleRate,
        jsonObject.levels,
        jsonObject.links
      );
    }
    return undefined;
  }

  deserialize(jsonObject: IAnnotJSON): OAnnotJSON | undefined {
    return OAnnotJSON.deserialize(jsonObject);
  }
}

export class OLevel<T extends OItem> implements ILevel {
  name = '';
  type: AnnotationLevelType;
  items: T[];

  constructor(name: string, type: AnnotationLevelType, items?: T[]) {
    this.name = name;
    this.type = type;
    this.items = items ?? [];
  }

  clone() {
    return new OLevel(
      this.name,
      this.type,
      this.items.map((a) => a.clone())
    );
  }

  getLeftSibling(index: number): T | undefined {
    return index > 0 ? this.items[index - 1] : undefined;
  }

  getRightSibling(index: number): T | undefined {
    return index > -1 && index < this.items.length - 1
      ? this.items[index + 1]
      : undefined;
  }
}

export class OSegmentLevel<T extends OSegment>
  extends OLevel<T>
  implements ISegmentLevel, Serializable<ISegmentLevel, OSegmentLevel<T>>
{
  constructor(name: string, items?: T[]) {
    super(name, AnnotationLevelType.SEGMENT, items);
  }

  serialize(): ISegmentLevel {
    return {
      items: this.items.map((a) => a.serialize()),
      name: this.name,
      type: this.type,
    };
  }

  deserialize<T extends OSegment>(jsonObject: ISegmentLevel): OSegmentLevel<T> {
    return OSegmentLevel.deserialize(jsonObject);
  }

  static deserialize<T extends OSegment>(
    jsonObject: ISegmentLevel
  ): OSegmentLevel<T> {
    return new OSegmentLevel<T>(
      jsonObject.name,
      jsonObject.items.map((a) => OSegment.deserialize(a) as T)
    );
  }
}

export class OItemLevel
  extends OLevel<OItem>
  implements IItemLevel, Serializable<IItemLevel, OItemLevel>
{
  constructor(name: string, items?: OItem[]) {
    super(name, AnnotationLevelType.ITEM);
    this.items = items ?? [];
  }

  serialize(): IItemLevel {
    return {
      items: this.items.map((a) => a.serialize()),
      name: this.name,
      type: this.type,
    };
  }

  static deserialize(jsonObject: IItemLevel): OItemLevel {
    return new OItemLevel(
      jsonObject.name,
      jsonObject.items.map((a) => OItem.deserialize(a))
    );
  }

  deserialize(jsonObject: IItemLevel): OItemLevel {
    return OItemLevel.deserialize(jsonObject);
  }
}

export class OEventLevel
  extends OLevel<OEvent>
  implements IEventLevel, Serializable<IEventLevel, OEventLevel>
{
  constructor(name: string, items?: OEvent[]) {
    super(name, AnnotationLevelType.EVENT);
    this.items = items ?? [];
  }

  static deserialize(jsonObject: IEventLevel): OEventLevel {
    return new OEventLevel(
      jsonObject.name,
      jsonObject.items.map((a) => OEvent.deserialize(a))
    );
  }

  deserialize(jsonObject: IEventLevel): OEventLevel {
    return OEventLevel.deserialize(jsonObject);
  }

  serialize(): IEventLevel {
    return {
      items: this.items.map((a) => a.serialize()),
      name: this.name,
      type: this.type,
    };
  }
}

export type OAnyLevel<T extends OSegment> =
  | OSegmentLevel<T>
  | OItemLevel
  | OEventLevel;

export class OItem implements IItem, Serializable<IItem, OItem> {
  public readonly type: 'segment' | 'event' | 'item' = 'item';

  id = 0;
  labels: OLabel[];

  constructor(id: number, labels?: ILabel[]) {
    this.id = id;

    this.labels = [];
    if (labels) {
      this.labels = labels.map((a) => new OLabel(a.name, a.value));
    }
  }

  serialize(): IItem {
    return {
      id: this.id,
      labels: this.labels.map((a) => a.serialize()),
    };
  }

  deserialize(jsonObject: IItem): OItem {
    return OItem.deserialize(jsonObject);
  }

  static deserialize(jsonObject: IItem): OItem {
    return new OItem(jsonObject.id, jsonObject.labels);
  }

  getFirstLabelWithoutName(notName: string) {
    return this.labels?.find((a) => a.name !== notName);
  }

  clone(id?: number) {
    return new OItem(id ?? this.id, [...this.labels]);
  }

  isEqualWith(other: OItem) {
    let labelsEqual = true;

    if (this.labels.length === other.labels.length) {
      for (const label of this.labels) {
        const found = other.labels.find((a) => a.name === label.name);
        if (!found || found.value !== label.value) {
          labelsEqual = false;
          break;
        }
      }
    } else {
      labelsEqual = false;
    }

    return this.id === other.id && labelsEqual;
  }
}

export class OSegment
  extends OItem
  implements Serializable<ISegment, OSegment>
{
  sampleStart = 0;
  sampleDur = 0;

  constructor(
    id: number,
    sampleStart: number,
    sampleDur: number,
    labels?: OLabel[]
  ) {
    super(id, labels);
    this.sampleStart = sampleStart;
    this.sampleDur = sampleDur;
  }

  override serialize(): ISegment {
    return {
      id: this.id,
      labels: this.labels.map((a) => OLabel.deserialize(a)),
      sampleDur: this.sampleDur,
      sampleStart: this.sampleStart,
    };
  }

  override deserialize(jsonObject: ISegment): OSegment {
    return OSegment.deserialize(jsonObject);
  }

  static override deserialize(
    jsonObject: ISegment,
    sampleRate?: number
  ): OSegment {
    return new OSegment(
      jsonObject.id,
      jsonObject.sampleStart,
      jsonObject.sampleDur,
      jsonObject.labels.map((a) => OLabel.deserialize(a))
    );
  }

  override clone(id?: number) {
    return new OSegment(id ?? this.id, this.sampleStart, this.sampleDur, [
      ...this.labels,
    ]);
  }
}

export class OEvent extends OItem implements Serializable<IEvent, OEvent> {
  public override readonly type: 'segment' | 'event' | 'item' = 'event';
  samplePoint;

  constructor(id: number, samplePoint: number, labels?: ILabel[]) {
    super(id, labels);
    this.samplePoint = samplePoint;
  }

  override serialize(): IEvent {
    return {
      samplePoint: this.samplePoint,
      id: this.id,
      labels: this.labels.map((a) => a.serialize()),
    };
  }

  override deserialize(jsonObject: IEvent): OEvent {
    return OEvent.deserialize(jsonObject);
  }

  static override deserialize(jsonObject: IEvent): OEvent {
    return new OEvent(jsonObject.id, jsonObject.samplePoint, jsonObject.labels);
  }

  override clone(id?: number) {
    return new OEvent(id ?? this.id, this.samplePoint, [...this.labels]);
  }
}

export class OLabel implements ILabel, Serializable<ILabel, OLabel> {
  name = '';
  value = '';

  constructor(name: string, value: string) {
    this.name = name;
    this.value = value;
  }

  serialize(): ILabel {
    return {
      name: this.name,
      value: this.value,
    };
  }

  deserialize(jsonObject: ILabel): OLabel {
    return OLabel.deserialize(jsonObject);
  }

  static deserialize(jsonObject: ILabel): OLabel {
    return new OLabel(jsonObject.name, jsonObject.value);
  }
}

export class OLink implements ILink, Serializable<ILink, OLink> {
  fromID: number;
  toID: number;

  constructor(fromID: number, toID: number) {
    this.fromID = fromID;
    this.toID = toID;
  }

  serialize(): ILink {
    return {
      fromID: this.fromID,
      toID: this.toID,
    };
  }

  deserialize(jsonObject: ILink): OLink {
    return OLink.deserialize(jsonObject);
  }

  static deserialize(jsonObject: ILink): OLink {
    return new OLink(jsonObject.fromID, jsonObject.toID);
  }

  clone() {
    return new OLink(this.fromID, this.toID);
  }
}

export enum AnnotationLevelType {
  ITEM = 'ITEM',
  EVENT = 'EVENT',
  SEGMENT = 'SEGMENT',
}
