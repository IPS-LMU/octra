import { EventEmitter, Injectable } from '@angular/core';
import { PlayBackStatus, SampleUnit } from '@octra/media';
import { contains } from '@octra/utilities';
import { ILog, OLog } from '../../obj/Settings/logging';
import { KeyStatisticElem } from '../../obj/statistics/KeyStatisticElem';
import { MouseStatisticElem } from '../../obj/statistics/MouseStatisticElem';
import { StatisticElem } from '../../obj/statistics/StatisticElement';

@Injectable({
  providedIn: 'root',
})
export class UserInteractionsService {
  private _afteradd: EventEmitter<StatisticElem> =
    new EventEmitter<StatisticElem>();

  startTime?: number;
  startReference?: ILog;

  get afteradd(): EventEmitter<StatisticElem> {
    return this._afteradd;
  }

  private _elements: StatisticElem[] = [];

  get elements(): StatisticElem[] {
    return this._elements;
  }

  set elements(value: StatisticElem[]) {
    this._elements = value;
  }

  /**
   * timestamp of lastAction
   */
  private _lastAction!: number;

  get lastAction(): number {
    return this._lastAction;
  }

  set lastAction(value: number) {
    this._lastAction = value;
  }

  private _enabled = false;

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
  }

  constructor() {
    this._elements = [];
  }

  init(enabled: boolean, startTime?: number, startReference?: ILog) {
    this.enabled = enabled;
    this.startTime = startTime;
    this.startReference = startReference;
  }

  /**
   * Parse Events
   */
  public addElementFromEvent(
    type: string,
    event: any,
    timestamp: number,
    playpos: SampleUnit | undefined,
    textSelection: { start?: number; end?: number } | undefined,
    audioSelection:
      | {
          start: number;
          length: number;
        }
      | undefined,
    transcriptionUnit:
      | {
          start: number;
          length: number;
          // tslint:disable-next-line:align
        }
      | undefined,
    targetName?: string
  ) {
    if (!this._enabled) {
      return;
    }

    if (!this.startTime) {
      throw new Error('Start time is undefined in logging!');
    }

    timestamp =
      Date.now() - this.startTime + (this.startReference?.timestamp ?? 0);

    this._lastAction = Date.now();
    const originalPlayerPos = playpos?.samples;
    textSelection = textSelection
      ? textSelection.end !== undefined &&
        textSelection.start !== undefined &&
        textSelection.end < textSelection.start
        ? {
            start: textSelection.start,
          }
        : textSelection
      : undefined;

    let name = '';
    let context: any = undefined;

    if (!targetName) {
      if (event && event.target) {
        context = event.target;
        name = context.getAttribute('name');

        if (!name && context !== undefined) {
          name = context.parentNode.getAttribute('name');
        }
        if (!name) {
          name = '';
        }
      }
    } else {
      name = targetName;
    }
    let elem: StatisticElem | undefined = undefined;
    if (contains(type, 'key') || contains(type, 'shortcut')) {
      elem = new KeyStatisticElem(
        type,
        name,
        event.value,
        timestamp,
        playpos?.samples,
        textSelection,
        audioSelection,
        transcriptionUnit
      );
    } else if (contains(type, 'mouse')) {
      elem = new MouseStatisticElem(
        type,
        name,
        event.value,
        timestamp,
        originalPlayerPos,
        textSelection,
        audioSelection,
        transcriptionUnit
      );
    } else if (contains(type, 'slider')) {
      elem = new MouseStatisticElem(
        type,
        name,
        event.new_value,
        timestamp,
        originalPlayerPos,
        textSelection,
        audioSelection,
        transcriptionUnit
      );
    } else {
      elem = new StatisticElem(
        type,
        name,
        event.value,
        timestamp,
        originalPlayerPos,
        audioSelection,
        transcriptionUnit
      );
    }

    if (elem) {
      this._elements.push(elem);
      this._afteradd.emit(elem);
      const newElem = new OLog(
        elem.timestamp,
        elem.type,
        elem.context,
        '',
        elem.playpos,
        elem.textSelection
      );

      if (elem instanceof MouseStatisticElem) {
        newElem.value = elem.value;
      } else if (elem instanceof KeyStatisticElem) {
        newElem.value = (elem as KeyStatisticElem).value;
      } else {
        newElem.value = (elem as StatisticElem).value;
      }
    }
  }

  public logAudioEvent(
    context: string,
    state: PlayBackStatus,
    playposition: SampleUnit,
    textSelection: { start?: number; end?: number } | undefined,
    audioSelection: { start: number; length: number } | undefined,
    segment: { start: number; length: number } | undefined
  ) {
    if (
      state !== PlayBackStatus.PLAYING &&
      state !== PlayBackStatus.INITIALIZED &&
      state !== PlayBackStatus.PREPARE
    ) {
      this.addElementFromEvent(
        'audio',
        { value: state.toLowerCase() },
        Date.now(),
        playposition,
        textSelection,
        audioSelection,
        segment,
        context
      );
    }
  }

  public elementsToAnyArray(): any[] {
    const result = [];
    for (let i = 0; i < this._elements.length; i++) {
      result.push(this.elements[i].getDataClone());
    }

    return result;
  }

  public fromAnyArray(array: any[]) {
    // BUG all events are considered as MouseStatisticEvent!
    for (const elem of array) {
      let newElem = undefined;

      newElem = MouseStatisticElem.fromAny(elem);
      if (newElem !== undefined) {
        newElem = StatisticElem.fromAny(elem);
      }

      if (newElem) {
        this.elements.push(newElem);
        newElem = {};
      }
    }
  }

  public clear() {
    this._elements = [];
  }

  private getElements(typeStr: string): StatisticElem[] {
    const result: StatisticElem[] = [];

    let type: any;

    if (typeStr === 'key') {
      type = KeyStatisticElem;
    } else if (typeStr === 'mouse') {
      type = MouseStatisticElem;
    }

    for (const elem of this.elements) {
      if (elem instanceof type) {
        result.push(elem);
      }
    }

    return result;
  }
}
