import {EventEmitter, Injectable} from '@angular/core';
import {StatisticElem} from '../../obj/statistics/StatisticElement';
import {KeyStatisticElem} from '../../obj/statistics/KeyStatisticElem';
import {MouseStatisticElem} from '../../obj/statistics/MouseStatisticElem';
import {Functions, isSet} from '../Functions';
import {OLog} from '../../obj/Settings/logging';
import {SampleUnit} from '../../../media-components/obj/audio';

@Injectable({
  providedIn: 'root'
})
export class UserInteractionsService {
  set lastAction(value: number) {
    this._lastAction = value;
  }

  get lastAction(): number {
    return this._lastAction;
  }

  get afteradd(): EventEmitter<StatisticElem> {
    return this._afteradd;
  }

  private _afteradd: EventEmitter<StatisticElem> = new EventEmitter<StatisticElem>();

  private _elements: StatisticElem[];

  /**
   * timestamp of lastAction
   */
  private _lastAction: number;

  get elements(): StatisticElem[] {
    return this._elements;
  }

  set elements(value: StatisticElem[]) {
    this._elements = value;
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
                             }, targetName?: string) {
    this._lastAction = Date.now();
    const originalPlayerPos = (!isSet(playpos)) ? playpos.samples : -1;

    if (this._enabled) {
      let name = '';
      let context: any = null;

      if (!targetName) {
        if (event && event.target) {
          context = event.target;
          name = context.getAttribute('name');

          if (!name && !isSet(context)) {
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
          (!isSet(playpos)) ? playpos.samples : -1,
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

  public elementsToAnyArray(): any[] {
    const result = [];
    for (let i = 0; i < this._elements.length; i++) {
      result.push(this.elements[i].getDataClone());
    }

    return result;
  }

  public fromAnyArray(array: any[]) {
    // BUG all events are considered as MouseStatisticEvent!
    for (let i = 0; i < array.length; i++) {
      const elem = array[i];
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

    for (let i = 0; i < this._elements.length; i++) {
      const elem = this._elements[i];

      if (elem instanceof type) {
        result.push(elem);
      }
    }

    return result;
  }
}
