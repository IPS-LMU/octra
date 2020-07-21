import {EventEmitter, Injectable} from '@angular/core';
import {Functions, isUnset, PlayBackStatus, SampleUnit} from 'octra-components';
import {OLog} from '../../obj/Settings/logging';
import {KeyStatisticElem} from '../../obj/statistics/KeyStatisticElem';
import {MouseStatisticElem} from '../../obj/statistics/MouseStatisticElem';
import {StatisticElem} from '../../obj/statistics/StatisticElement';

@Injectable({
  providedIn: 'root'
})
export class UserInteractionsService {
  private _afteradd: EventEmitter<StatisticElem> = new EventEmitter<StatisticElem>();

  get afteradd(): EventEmitter<StatisticElem> {
    return this._afteradd;
  }

  private _elements: StatisticElem[];

  get elements(): StatisticElem[] {
    return this._elements;
  }

  set elements(value: StatisticElem[]) {
    this._elements = value;
  }

  /**
   * timestamp of lastAction
   */
  private _lastAction: number;

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

  /**
   * Parse Events
   */
  public addElementFromEvent(type: string, event: any, timestamp: number, playpos: SampleUnit, caretpos: number,
                             selection: {
                               start: number,
                               length: number
                             },
                             segment: {
                               start: number,
                               length: number
                               // tslint:disable-next-line:align
                             }, targetName?: string) {
    this._lastAction = Date.now();
    const originalPlayerPos = (!isUnset(playpos)) ? playpos.samples : -1;

    if (this._enabled) {
      let name = '';
      let context: any = null;

      if (!targetName) {
        if (event && event.target) {
          context = event.target;
          name = context.getAttribute('name');

          if (!name && !isUnset(context)) {
            name = context.parentNode.getAttribute('name');
          }
          if (!name) {
            name = '';
          }
        }
      } else {
        name = targetName;
      }
      let elem = null;
      if (Functions.contains(type, 'key') || Functions.contains(type, 'shortcut')) {
        elem = new KeyStatisticElem(
          type,
          name,
          event.value,
          timestamp,
          (!isUnset(playpos)) ? playpos.samples : -1,
          caretpos,
          selection,
          segment
        );
      } else if (Functions.contains(type, 'mouse')) {
        elem = new MouseStatisticElem(type, name, event.value, timestamp, originalPlayerPos, caretpos,
          selection, segment);
      } else if (Functions.contains(type, 'slider')) {
        elem = new MouseStatisticElem(type, name, event.new_value, timestamp, originalPlayerPos, caretpos,
          selection, segment);
      } else {
        elem = new StatisticElem(type, name, event.value, timestamp, originalPlayerPos,
          selection, segment);
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
          elem.caretpos
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
  }

  public logAudioEvent(context: string, state: PlayBackStatus, playposition: SampleUnit, caretpos: number,
                       selection: { start: number, length: number }, segment: { start: number, length: number }) {
    if (state !== PlayBackStatus.PLAYING && state !== PlayBackStatus.INITIALIZED && state !== PlayBackStatus.PREPARE) {
      this.addElementFromEvent('audio',
        {value: state.toLowerCase()}, Date.now(),
        playposition,
        caretpos, selection, segment, context);
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
      let newElem = null;

      newElem = MouseStatisticElem.fromAny(elem);
      if (newElem) {
      } else {
        console.log(`is not mouse StatisticElem`);
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

  private getElements(typeStr: string):
    StatisticElem[] {
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
