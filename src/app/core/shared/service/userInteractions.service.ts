import {EventEmitter, Injectable} from '@angular/core';
import {StatisticElem} from '../../obj/statistics/StatisticElement';
import {KeyStatisticElem} from '../../obj/statistics/KeyStatisticElem';
import {MouseStatisticElem} from '../../obj/statistics/MouseStatisticElem';
import {Functions} from '../Functions';
import {OLog} from '../../obj/Settings/logging';

@Injectable()
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
   * @param type
   * @param event
   */
  public addElementFromEvent(type: string, event: any, timestamp: number, playerpos: number, caretpos: number,
                             target_name?: string, segment?: {
      start: number,
      length: number,
      textlength: number
    }) {
    this._lastAction = Date.now();

    if (this._enabled) {
      let name = '';
      let context: any = null;

      if ((segment === null || segment === undefined)) {
        segment = {
          start: -1,
          length: -1,
          textlength: -1
        };
      }

      if (!target_name) {
        if (event && event.target) {
          context = event.target;
          name = context.getAttribute('name');

          if (!name) {
            name = context.parentNode.getAttribute('name');
          }
          if (!name) {
            name = '';
          }
        }
      } else {
        name = target_name;
      }
      let elem = null;
      if (Functions.contains(type, 'key') || Functions.contains(type, 'shortcut')) {
        elem = new KeyStatisticElem(
          type,
          name,
          event.value,
          timestamp,
          playerpos,
          caretpos,
          segment
        );
      } else if (Functions.contains(type, 'mouse')) {
        elem = new MouseStatisticElem(type, name, event.value, timestamp, playerpos, caretpos, segment);
      } else if (Functions.contains(type, 'slider')) {
        elem = new MouseStatisticElem(type, name, event.new_value, timestamp, playerpos, caretpos, segment);
      } else {
        elem = new StatisticElem(type, name, event.value, timestamp, playerpos);
      }

      if (elem) {
        this._elements.push(elem);
        this._afteradd.emit(elem);
        const new_elem = new OLog(
          elem.timestamp,
          elem.type,
          elem.context,
          '',
          elem.playerpos,
          elem.caretpos
        );

        if (elem instanceof MouseStatisticElem) {
          new_elem.value = elem.value;
        } else if (elem instanceof KeyStatisticElem) {
          new_elem.value = (<KeyStatisticElem>elem).value;
        } else {
          new_elem.value = (<StatisticElem>elem).value;
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
    for (let i = 0; i < array.length; i++) {
      const elem = array[i];
      let new_elem = null;

      if (new_elem) {
      } else {
        new_elem = MouseStatisticElem.fromAny(elem);
        if (new_elem) {
        } else {
          new_elem = StatisticElem.fromAny(elem);
          if (new_elem) {
          }

        }
      }

      if (new_elem) {
        this.elements.push(new_elem);
        new_elem = {};
      }
    }
  }

  public clear() {
    this._elements = [];
  }

  private getElements(type_str: string): StatisticElem[] {
    const result: StatisticElem[] = [];

    let type: any;

    if (type_str === 'key') {
      type = KeyStatisticElem;
    } else if (type_str === 'mouse') {
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
