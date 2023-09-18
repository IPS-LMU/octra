import { SampleUnit } from '@octra/media';
import {
  AnnotationLevelType,
  IItemLevel,
  OAnnotJSON,
  OEvent,
  OEventLevel,
  OItem,
  OItemLevel,
  OLabel,
  OLevel,
  OLink,
  OSegment,
  OSegmentLevel,
} from './annotjson';
import {
  ASRContext,
  OctraAnnotationEvent,
  OctraAnnotationSegment,
} from './octraAnnotationSegment';

export class OctraAnnotationLink {
  get id(): number {
    return this._id;
  }

  get link(): OLink {
    return this._link;
  }

  constructor(private _id: number, private _link: OLink) {}

  clone() {
    return new OctraAnnotationLink(this._id, this._link.clone());
  }
}

export class OctraAnnotation<
  S extends ASRContext,
  T extends OctraAnnotationSegment<S>
> {
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

  private _idCounters: {
    level: number;
    link: number;
    item: number;
  } = {
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
      level: number;
      link: number;
      item: number;
    }
  ) {
    this._levels = levels ?? [];
    this._links = links ?? [];

    if (idCounters) {
      this._idCounters = idCounters;
    } else {
      this.updateIDCounters();
    }
  }

  public updateIDCounters() {
    this.idCounters.item = Math.max(
      1,
      ...this.levels.map((a) => {
        if (
          a instanceof OctraAnnotationSegmentLevel ||
          a instanceof OctraAnnotationEventLevel
        ) {
          return Math.max(0, ...a.items.map((b) => b.id)) + 1;
        }
        return 1;
      })
    );
    this.idCounters.link = Math.max(0, ...this.links.map((a) => a.id)) + 1;
    this.idCounters.level = Math.max(0, ...this.levels.map((a) => a.id)) + 1;
  }

  public changeLevelIndex(index: number) {
    this._selectedLevelIndex = index;
    return this;
  }

  createSegmentLevel(
    name: string,
    items?: T[]
  ): OctraAnnotationSegmentLevel<T> {
    return new OctraAnnotationSegmentLevel<T>(
      this._idCounters.level++,
      name,
      items
    );
  }

  clearAllItemsFromCurrentLevel() {
    if (this.currentLevel) {
      this.currentLevel.clear();
    }
    return this;
  }

  createEventLevel(
    name: string,
    items: OctraAnnotationEvent[]
  ): OctraAnnotationEventLevel {
    return new OctraAnnotationEventLevel(this._idCounters.level++, name, items);
  }

  createItemLevel(name: string, items: OItem[]): OctraAnnotationItemLevel {
    return new OctraAnnotationItemLevel(this._idCounters.level++, name, items);
  }

  createSegment(time: SampleUnit, labels?: OLabel[], context?: S) {
    return new OctraAnnotationSegment<ASRContext>(
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
      const duplicate = level.duplicate(
        this._idCounters.level++,
        this._idCounters.item
      );

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
        return this.changeCurrentItemByIndex(index, item);
      }
    } else {
      throw new Error('Current level not selected');
    }
    return this;
  }

  changeCurrentItemByIndex(index: number, item: OItem | OEvent | T) {
    if (this.currentLevel) {
      if (index > -1) {
        this.currentLevel.changeItem(item as any);
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
      return this.changeCurrentItemByIndex(index, item);
    }
    throw new Error(`Can't find segment at sample position ${samples.samples}`);
  }

  addItemToCurrentLevel(time?: SampleUnit, labels?: OLabel[], context?: S) {
    if (this.currentLevel) {
      if (this.currentLevel.type === 'SEGMENT') {
        // check situation
        const level = this.currentLevel as OctraAnnotationSegmentLevel<T>;
        let items: T[] = level.items.map((a) => a.clone() as T);

        if (items.length > 0) {
          //insert
          const index = items.findIndex((a) => a.time.samples > time!.samples);

          if (index > -1) {
            const oldLabels =
              index === 0
                ? [new OLabel(level.name, '')]
                : [...items[index].labels];
            items[index].labels =
              index === 0 ? items[index].labels : [new OLabel(level.name, '')];
            items = [
              ...items,
              new OctraAnnotationSegment(
                this.idCounters.item++,
                time!,
                oldLabels ?? labels,
                context ?? {}
              ) as any,
            ];
            items.sort(this.sortSegmentsBySampleUnit);
          }
        } else {
          items.push(
            new OctraAnnotationSegment(
              this.idCounters.item++,
              time!,
              labels,
              context ?? {}
            ) as any
          );
        }
        this.currentLevel.overwriteItems(items as any);
      } else if (this.currentLevel.type === 'ITEM') {
        this.currentLevel.overwriteItems([
          ...this.currentLevel.items,
          new OItem(this.idCounters.item++, labels) as any,
        ]);
      } else {
        const newEvents = [
          ...this.currentLevel.items,
          new OEvent(this.idCounters.item++, time!.samples!, labels) as any,
        ];
        newEvents.sort(this.sortEventsBySampleUnit);
        this.currentLevel.overwriteItems(newEvents);
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

    if (
      this._selectedLevelIndex !== undefined &&
      this._selectedLevelIndex !== null &&
      index > -1 &&
      index < this.currentLevel.items.length
    ) {
      if (
        index < this.currentLevel.items.length - 1 &&
        silenceValue !== undefined &&
        silenceValue !== '' &&
        this.currentLevel.type === 'SEGMENT'
      ) {
        const nextSegment = this.currentLevel.items[
          index + 1
        ] as OctraAnnotationSegment;
        const transcription = (
          this.currentLevel.items[index] as OctraAnnotationSegment
        ).getFirstLabelWithoutName('Speaker')?.value;

        if (
          silenceValue !== undefined &&
          nextSegment.getFirstLabelWithoutName('Speaker')?.value !==
            silenceValue &&
          transcription !== silenceValue &&
          mergeTranscripts
        ) {
          // concat transcripts
          if (
            nextSegment.getFirstLabelWithoutName('Speaker') &&
            transcription !== ''
          ) {
            nextSegment.changeFirstLabelWithoutName(
              'Speaker',
              transcription +
                ' ' +
                nextSegment.getFirstLabelWithoutName('Speaker')?.value
            );
          } else if (
            !nextSegment.getFirstLabelWithoutName('Speaker') &&
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
        this.currentLevel.changeItem(nextSegment as any);
      }

      this.currentLevel.overwriteItems([
        ...this.currentLevel.items.slice(0, index),
        ...this.currentLevel.items.slice(index + 1),
      ] as any);
      const t = '';
    }

    return this;
  }

  removeItemById(id: number, silenceCode?: string, mergeTranscripts?: boolean) {
    const index = this.currentLevel?.items.findIndex((a) => a.id === id);
    if (index !== undefined && index > -1) {
      return this.removeItemByIndex(index, silenceCode, mergeTranscripts);
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

  changeSampleRate(sampleRate: number) {
    const levels = this._levels.map((level, i) => {
      if (level.type === 'SEGMENT') {
        return new OctraAnnotationSegmentLevel<
          OctraAnnotationSegment<ASRContext>
        >(
          level.id,
          level.name,
          (level.items as OctraAnnotationSegment<ASRContext>[]).map(
            (a) =>
              new OctraAnnotationSegment<ASRContext>(
                a.id,
                new SampleUnit(a.time.samples, sampleRate),
                a.labels,
                a.context
              )
          )
        );
      } else if (level.type === 'EVENT') {
        return new OctraAnnotationEventLevel(
          level.id,
          level.name,
          (level.items as OctraAnnotationEvent[]).map(
            (a) =>
              new OctraAnnotationEvent(
                a.id,
                new SampleUnit(a.samplePoint.samples, a.samplePoint.sampleRate),
                a.labels
              )
          )
        );
      }
      return level;
    }) as any;

    const result = new OctraAnnotation(
      levels,
      this._links.map((a) => a.clone()),
      this.idCounters
    );
    result.changeCurrentLevelIndex(this._selectedLevelIndex!);
    return result;
  }

  serialize(
    fileName: string,
    sampleRate: number,
    lastSegmentTime: SampleUnit
  ): OAnnotJSON {
    return new OAnnotJSON(
      fileName,
      fileName.replace(/\.[^.]$/g, ''),
      sampleRate,
      this.levels.map((a) => a.serialize(lastSegmentTime)),
      this.links.map((a) => a.link.serialize())
    );
  }

  static deserialize<S extends ASRContext, T extends OctraAnnotationSegment<S>>(
    jsonObject: OAnnotJSON
  ): OctraAnnotation<S, T> {
    const result = new OctraAnnotation<S, T>();

    for (const jsonObjectElement of jsonObject.levels) {
      if (jsonObjectElement instanceof OSegmentLevel) {
        result.levels.push(
          result.createSegmentLevel(
            jsonObjectElement.name,
            jsonObjectElement.items.map((a) =>
              OctraAnnotationSegment.deserializeFromOSegment(
                a,
                jsonObject.sampleRate
              )
            ) as T[]
          )
        );
      } else if (jsonObjectElement instanceof OEventLevel) {
        result.levels.push(
          result.createEventLevel(
            jsonObjectElement.name,
            jsonObjectElement.items.map(
              (a) =>
                new OctraAnnotationEvent(
                  a.id,
                  new SampleUnit(a.samplePoint, jsonObject.sampleRate),
                  a.labels
                )
            )
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

    result.updateIDCounters();
    return result;
  }

  clone() {
    const result = new OctraAnnotation([], [], {
      ...this._idCounters,
    });

    const levels = this.levels.map((a) => a.clone());
    const links = this.links.map((a) => a.clone());
    result.links.push(...links);
    result.levels.push(...levels);
    result.changeCurrentLevelIndex(this._selectedLevelIndex ?? -1);

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

  clear() {
    this.level.items = [];
  }

  constructor(protected _id: number, level: T) {
    this.level = level;
  }

  overwriteItems(items: S[]) {
    this.level.items = items;
  }

  duplicate(id: number, itemIDCounter: number): OctraAnnotationLevel<T, S> {
    const result = new OctraAnnotationLevel<T, S>(
      id,
      new OLevel<S>(this.level.name + '_2', this.level.type, [
        ...this.level.items.map((a) => {
          return a.clone(itemIDCounter++) as S;
        }),
      ]) as T
    );
    return result;
  }

  serialize(lastSegmentTime: SampleUnit): IItemLevel {
    return {
      items: this.level.items.map((a) => a.serialize()),
      name: this.level.name,
      type: this.type,
    };
  }

  changeItem(item: S) {
    const index = this.items.findIndex((a) => a.id === item.id);
    if (index > -1) {
      this.level.items = [
        ...this.level.items.slice(0, index),
        item,
        ...this.level.items.slice(index + 1),
      ];
    } else {
      throw new Error(`Can't change item with id ${item.id}: not found.`);
    }

    return this;
  }
}

export class OctraAnnotationSegmentLevel<
  T extends OctraAnnotationSegment<ASRContext>
> extends OctraAnnotationLevel<OLevel<T>, T> {
  constructor(id: number, name: string, items?: T[]) {
    super(id, new OLevel<T>(name, AnnotationLevelType.SEGMENT, items));
  }

  override serialize(lastSegmentTime: SampleUnit): any {
    let start = 0;
    const res = {
      items: this.level.items.map((a) => {
        const result = a.serializeToOSegment(start);
        start += a.time.samples;

        return result;
      }),
      name: this.level.name,
      type: this.type,
    };
    const lastItem = res.items[res.items.length - 1];
    if (lastItem.sampleStart + lastItem.sampleDur < lastSegmentTime.samples) {
      res.items.push(
        new OSegment(
          1000000000,
          lastItem.sampleStart + lastItem.sampleDur,
          lastSegmentTime.samples - lastItem.sampleStart + lastItem.sampleDur,
          [new OLabel(this.name, '')]
        )
      );
    }

    return res;
  }

  clone() {
    return new OctraAnnotationSegmentLevel<T>(
      this._id,
      this.name,
      this.level.items.map((a) => a.clone() as any)
    );
  }
}

export class OctraAnnotationItemLevel extends OctraAnnotationLevel<
  OItemLevel,
  OItem
> {
  constructor(id: number, name: string, items?: OItem[]) {
    super(id, new OItemLevel(name, items));
  }

  override serialize(): IItemLevel {
    return {
      items: this.level.items.map((a) => a.serialize()),
      name: this.level.name,
      type: this.type,
    };
  }

  clone() {
    return new OctraAnnotationItemLevel(
      this.id,
      this.name,
      this.items.map((a) => a.clone())
    );
  }
}

export class OctraAnnotationEventLevel {
  id!: number;
  name!: string;
  items!: OctraAnnotationEvent[];
  type = AnnotationLevelType.EVENT;

  constructor(id: number, name: string, items?: OctraAnnotationEvent[]) {
    this.id = id;
    this.name = name;
    this.items = items ?? [];
  }

  overwriteItems(items: OctraAnnotationEvent[]) {
    this.items = items;
  }

  serialize(): OEventLevel {
    return new OEventLevel(
      this.name,
      this.items.map((a) => new OEvent(a.id, a.samplePoint.samples, a.labels))
    );
  }

  clone() {
    return new OctraAnnotationEventLevel(
      this.id,
      this.name,
      this.items.map((a) => a.clone())
    );
  }

  clear() {
    this.items = [];
  }

  duplicate(id: number, itemIDCounter: number): OctraAnnotationEventLevel {
    const result = new OctraAnnotationEventLevel(
      id,
      this.name + '_2',
      this.items.map((a) => {
        return a.clone(itemIDCounter++);
      })
    );
    return result;
  }

  changeItem(item: OctraAnnotationEvent) {
    const index = this.items.findIndex((a) => a.id === item.id);
    if (index > -1) {
      this.items = [
        ...this.items.slice(0, index),
        item,
        ...this.items.slice(index + 1),
      ];
    } else {
      throw new Error(`Can't change item with id ${item.id}: not found.`);
    }

    return this;
  }
}

export type OctraAnnotationAnyLevel<
  T extends OctraAnnotationSegment<ASRContext>
> =
  | OctraAnnotationSegmentLevel<T>
  | OctraAnnotationItemLevel
  | OctraAnnotationEventLevel;
