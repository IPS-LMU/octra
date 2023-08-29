import { SampleUnit } from '@octra/media';
import {
  AnnotationLevelType,
  IEventLevel,
  IItemLevel,
  ISegmentLevel,
  OAnnotJSON,
  OEvent,
  OEventLevel,
  OItem,
  OItemLevel,
  OLabel,
  OLevel,
  OLink,
  OSegmentLevel,
} from './annotjson';
import { ASRContext, Segment } from './segment';

export class OctraAnnotationLink {
  get id(): number {
    return this._id;
  }

  get link(): OLink {
    return this._link;
  }

  constructor(private _id: number, private _link: OLink) {}
}

export class OctraAnnotation<S extends ASRContext, T extends Segment<S>> {
  get selectedLevelIndex(): number | undefined {
    return this._selectedLevelIndex;
  }

  get links(): OctraAnnotationLink[] {
    return this._links;
  }

  get levels(): OctraAnnotationAnyLevel<T>[] {
    return this._levels;
  }

  get idCounters(): {
    item: number;
    level: number;
    link: number;
  } {
    return this._idCounters;
  }

  private _levels: OctraAnnotationAnyLevel<T>[] = [];
  private _links: OctraAnnotationLink[] = [];

  private _idCounters = {
    level: 1,
    link: 1,
    item: 1,
  };

  private _selectedLevelIndex?: number;

  public get currentLevel(): OctraAnnotationAnyLevel<T> | undefined {
    if (this._selectedLevelIndex !== undefined) {
      return this._levels[this._selectedLevelIndex];
    }
    return undefined;
  }

  constructor(
    levels?: OctraAnnotationAnyLevel<T>[],
    links?: OctraAnnotationLink[],
    idCounters?: {
      level: 1;
      link: 1;
      item: 1;
    }
  ) {
    this._levels = levels ?? [];
    this._links = links ?? [];

    if (idCounters) {
      this._idCounters = idCounters;
    } else {
      this.idCounters.item = Math.max(
        1,
        ...this.levels.map((a) => {
          if (
            a instanceof OctraAnnotationSegmentLevel ||
            a instanceof OctraAnnotationEventLevel
          ) {
            return Math.max(1, ...a.items.map((b) => b.id));
          }
          return 1;
        })
      );
      this.idCounters.link = Math.max(1, ...this.links.map((a) => a.id));
      this.idCounters.level = Math.max(1, ...this.levels.map((a) => a.id));
    }
  }

  public changeLevelIndex(index: number) {
    this._selectedLevelIndex = index;
    return this;
  }

  createSegmentLevel(name: string, items: T[]): OctraAnnotationSegmentLevel<T> {
    return new OctraAnnotationSegmentLevel<T>(
      this._idCounters.level++,
      name,
      items
    );
  }

  clearAllItemsFromCurrentLevel(){
    if(this.currentLevel) {
      this.currentLevel.clear();
    }
    return this;
  }

  createEventLevel(name: string, items: OEvent[]): OctraAnnotationEventLevel {
    return new OctraAnnotationEventLevel(this._idCounters.level++, name, items);
  }

  createItemLevel(name: string, items: OItem[]): OctraAnnotationItemLevel {
    return new OctraAnnotationItemLevel(this._idCounters.level++, name, items);
  }

  createSegment(time: SampleUnit, labels?: OLabel[], context?: S) {
    return new Segment<ASRContext>(
      this._idCounters.item++,
      time,
      labels,
      context
    );
  }

  addLevel(level: OctraAnnotationAnyLevel<T>) {
    this._levels.push(level);
    return this;
  }

  duplicateLevel(index: number) {
    if (index > -1 && index < this._levels.length) {
      const level = this._levels[index];
      const duplicate: OctraAnnotationAnyLevel<Segment<ASRContext>> =
        level.clone(this._idCounters.level++, this._idCounters.item);

      this._levels = [
        ...this._levels.slice(0, index),
        duplicate as OctraAnnotationAnyLevel<T>,
        ...this._levels.slice(index),
      ];

      return this;
    } else {
      throw new Error(`Can't find level with index ${index}`);
    }
  }

  combineSegments(
    segmentIndexStart: number,
    segmentIndexEnd: number,
    breakMarker: string
  ) {
    for (let i = segmentIndexStart; i < segmentIndexEnd; i++) {
      this.removeItemByIndex(i);
      i--;
      segmentIndexEnd--;
    }
  }

  removeLevel(id: number) {
    this._levels = this._levels.filter((a) => a.id !== id);
    return this;
  }

  changeLevelById(id: number, level: OctraAnnotationAnyLevel<T>) {
    const index = this._levels.findIndex((a) => a.id === id);
    if (index > -1) {
      this._levels[index] = level;
    } else {
      throw new Error(`Can't find level with id ${id}`);
    }
    return this;
  }

  changeLevelByIndex(index: number, level: OctraAnnotationAnyLevel<T>) {
    if (index > -1 && index < this._levels.length) {
      this._levels[index] = level;
    } else {
      throw new Error(`Can't find level with index ${index}`);
    }
    return this;
  }

  changeCurrentLevelIndex(index: number) {
    if (index > -1 && index < this._levels.length) {
      this._selectedLevelIndex = index;
    }
    return this;
  }

  changeCurrentItemById(id: number, item: OItem | OEvent | T) {
    if (this.currentLevel) {
      const index = this.currentLevel.items.findIndex((a) => a.id === id);
      if (index > -1) {
        this.currentLevel.items[index] = item;
      }
    } else {
      throw new Error('Current level not selected');
    }
    return this;
  }

  changeCurrentItemByIndex(index: number, item: OItem | OEvent | T) {
    if (this.currentLevel) {
      if (index > -1) {
        this.currentLevel.items[index] = item;
      }
    } else {
      throw new Error('Current level not selected');
    }
    return this;
  }

  getCurrentSegmentIndexBySamplePosition(samples: SampleUnit): number {
    if (
      !this.currentLevel ||
      !(this.currentLevel instanceof OctraAnnotationSegmentLevel)
    ) {
      return -1;
    }

    let begin = 0;
    for (let i = 0; i < this.currentLevel.items.length; i++) {
      if (i > 0) {
        begin = this.currentLevel.items[i - 1].time.samples;
      }
      if (
        samples.samples > begin &&
        samples.samples <= this.currentLevel.items[i].time.samples
      ) {
        return i;
      }
    }
    return -1;
  }

  changeCurrentSegmentBySamplePosition(samples: SampleUnit, item: T) {
    const index = this.getCurrentSegmentIndexBySamplePosition(samples);
    if (index > -1) {
      this.currentLevel!.items[index] = item;
      return this;
    }
    throw new Error(`Can't find segment at sample position ${samples.samples}`);
  }

  addItemToCurrentLevel(time?: SampleUnit, labels?: OLabel[], context?: S) {
    if (this.currentLevel) {
      if (this.currentLevel instanceof OctraAnnotationSegmentLevel) {
        this.currentLevel.items.push(
          new Segment(this.idCounters.item++, time!, labels, context) as T
        );
        this.currentLevel.items.sort(this.sortSegmentsBySampleUnit);
      } else if (this.currentLevel instanceof OctraAnnotationItemLevel) {
        this.currentLevel.items.push(new OItem(this.idCounters.item++, labels));
      } else {
        this.currentLevel.items.push(
          new OEvent(this.idCounters.item++, time!.samples!, labels)
        );
        this.currentLevel.items.sort(this.sortEventsBySampleUnit);
      }
    }

    return this;
  }

  removeItemByIndex(
    index: number,
    silenceValue?: string,
    mergeTranscripts?: boolean
  ) {
    if (!this.currentLevel) {
      throw new Error('Current level is undefined');
    }

    if (index > -1 && index < this.currentLevel.items.length) {
      const segment = this.currentLevel.items[index];
      if (
        index < this.currentLevel.items.length - 1 &&
        silenceValue !== undefined &&
        silenceValue !== '' &&
        this.currentLevel instanceof OctraAnnotationSegmentLevel
      ) {
        const nextSegment = this.currentLevel.items[index + 1];
        const transcription =
          this.currentLevel.items[index].getFirstLabelWithoutName(
            'Speaker'
          )?.value;

        if (
          silenceValue !== undefined &&
          nextSegment.getFirstLabelWithoutName('Speaker')?.value !==
            silenceValue &&
          transcription !== silenceValue &&
          mergeTranscripts
        ) {
          // concat transcripts
          if (
            nextSegment.getFirstLabelWithoutName('Speaker')?.value !== '' &&
            transcription !== ''
          ) {
            nextSegment.changeFirstLabelWithoutName(
              'Speaker',
              transcription +
                ' ' +
                nextSegment.getFirstLabelWithoutName('Speaker')?.value
            );
          } else if (
            nextSegment.getFirstLabelWithoutName('Speaker')?.value === '' &&
            transcription !== ''
          ) {
            nextSegment.changeFirstLabelWithoutName(
              'Speaker',
              transcription ?? ''
            );
          }
        } else if (
          nextSegment.getFirstLabelWithoutName('Speaker')?.value ===
          silenceValue
        ) {
          // delete pause
          nextSegment.changeFirstLabelWithoutName(
            'Speaker',
            transcription ?? ''
          );
        }
      }

      this.currentLevel.items.splice(index, 1);
    }

    return this;
  }

  removeItemById(id: number) {
    if (id > -1) {
      this._levels = this._levels.filter((a) => a.id === id);
    } else {
      throw new Error(`Can't find item with id ${id}`);
    }

    return this;
  }

  addLink(fromID: number, toID: number) {
    this._links.push(
      new OctraAnnotationLink(this.idCounters.link++, new OLink(fromID, toID))
    );
  }

  changeLinkById(id: number, oLink: OLink) {
    const index = this._links.findIndex((a) => a.id === id);
    if (index > -1) {
      this._links[index] = new OctraAnnotationLink(id, oLink);
    } else {
      throw new Error(`Can't find link with id ${id}`);
    }
  }

  changeLinkByIndex(index: number, oLink: OLink) {
    if (index > -1) {
      this._links[index] = new OctraAnnotationLink(
        this._links[index].id,
        oLink
      );
    } else {
      throw new Error(`Can't find link with index ${index}`);
    }
  }

  private sortSegmentsBySampleUnit(a: T, b: T) {
    if (a.time.samples > b.time.samples) {
      return 1;
    } else if (a.time.samples < b.time.samples) {
      return -1;
    }
    return 0;
  }

  private sortEventsBySampleUnit(a: OEvent, b: OEvent) {
    if (a.samplePoint > b.samplePoint) {
      return 1;
    } else if (a.samplePoint < b.samplePoint) {
      return -1;
    }
    return 0;
  }

  deserialize(jsonObject: OAnnotJSON): OctraAnnotation<S, T> {
    return OctraAnnotation.deserialize(jsonObject);
  }

  serialize(fileName: string, sampleRate: number): OAnnotJSON {
    return new OAnnotJSON(
      fileName,
      fileName.replace(/\.[^.]$/g, ''),
      sampleRate,
      this.levels.map((a) => a.serialize()),
      this.links.map((a) => a.link.serialize())
    );
  }

  static deserialize<S extends ASRContext, T extends Segment<S>>(
    jsonObject: OAnnotJSON
  ): OctraAnnotation<S, T> {
    const result = new OctraAnnotation<S, T>();

    for (const jsonObjectElement of jsonObject.levels) {
      if (jsonObjectElement instanceof OSegmentLevel) {
        result.levels.push(
          result.createSegmentLevel(
            jsonObjectElement.name,
            jsonObjectElement.items.map((a) =>
              Segment.deserializeFromOSegment(a, jsonObject.sampleRate)
            ) as T[]
          )
        );
      } else if (jsonObjectElement instanceof OEventLevel) {
        result.levels.push(
          result.createEventLevel(
            jsonObjectElement.name,
            jsonObjectElement.items
          )
        );
      } else {
        result.levels.push(
          result.createItemLevel(
            jsonObjectElement.name,
            jsonObjectElement.items
          )
        );
      }
    }

    for (const link of jsonObject.links) {
      result.addLink(link.fromID, link.toID);
    }

    return result;
  }
}

export class OctraAnnotationLevel<T extends OLevel<S>, S extends OItem> {
  get sortorder(): number {
    return this._sortorder;
  }

  get id(): number {
    return this._id;
  }

  get items(): S[] {
    return this.level.items;
  }

  get name(): string {
    return this.level.name;
  }

  private _sortorder = 0;

  level: T;

  public get type() {
    return this.level.type;
  }

  clear(){
    this.level.items = [];
  }

  constructor(protected _id: number, level: T) {
    this.level = level;
  }
}

export class OctraAnnotationSegmentLevel<
  T extends Segment<ASRContext>
> extends OctraAnnotationLevel<OLevel<T>, T> {
  constructor(id: number, name: string, items?: T[]) {
    super(id, new OLevel<T>(name, AnnotationLevelType.SEGMENT, items));
  }

  serialize(lastSegmentTime?: SampleUnit): ISegmentLevel {
    return {
      items: this.level.items.map((a) =>
        a.serializeToOSegment(lastSegmentTime!.samples!)
      ),
      name: this.level.name,
      type: this.type,
    };
  }

  clone(id: number, itemIDCounter: number) {
    return new OctraAnnotationSegmentLevel(id, this.level.name + '_2', [
      ...this.level.items.map((a) => {
        return a.clone(itemIDCounter++);
      }),
    ]);
  }
}

export class OctraAnnotationItemLevel extends OctraAnnotationLevel<
  OItemLevel,
  OItem
> {
  constructor(id: number, name: string, items?: OItem[]) {
    super(id, new OItemLevel(name, items));
  }

  serialize(): IItemLevel {
    return {
      items: this.level.items.map((a) => a.serialize()),
      name: this.level.name,
      type: this.type,
    };
  }

  clone(id: number) {
    return new OctraAnnotationItemLevel(
      id,
      this.level.name + '_2',
      this.level.items
    );
  }
}

export class OctraAnnotationEventLevel extends OctraAnnotationLevel<
  OEventLevel,
  OEvent
> {
  constructor(id: number, name: string, items?: OEvent[]) {
    super(id, new OEventLevel(name, items));
  }

  serialize(): IEventLevel {
    return {
      items: this.level.items.map((a) => a.serialize()),
      name: this.level.name,
      type: this.type,
    };
  }

  clone(id: number) {
    return new OctraAnnotationEventLevel(
      id,
      this.level.name + '_2',
      this.level.items
    );
  }
}

export type OctraAnnotationAnyLevel<T extends Segment<ASRContext>> =
  | OctraAnnotationSegmentLevel<T>
  | OctraAnnotationItemLevel
  | OctraAnnotationEventLevel;
