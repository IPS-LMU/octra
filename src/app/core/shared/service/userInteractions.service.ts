import {EventEmitter, Injectable} from '@angular/core';
import 'rxjs/Rx';
import {StatisticElem} from '../../obj/statistics/StatisticElement';
import {KeyStatisticElem} from '../../obj/statistics/KeyStatisticElem';
import {MouseStatisticElem} from '../../obj/statistics/MouseStatisticElem';
import {Functions} from '../Functions';
import {isNullOrUndefined} from 'util';

@Injectable()
export class UserInteractionsService {
  set enabled(value: boolean) {
    this._enabled = value;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get elements(): StatisticElem[] {
    return this._elements;
  }

  set elements(value: StatisticElem[]) {
    this._elements = value;
  }

  private _elements: StatisticElem[];
  public afteradd: EventEmitter<StatisticElem> = new EventEmitter<StatisticElem>();
  private _enabled = false;

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

    if (this._enabled) {
      let name = '';
      let target: any = null;

      if (isNullOrUndefined(segment)) {
        segment = {
          start: -1,
          length: -1,
          textlength: -1
        };
      }

      if (!target_name) {
        if (event && event.target) {
          target = event.target;
          name = target.getAttribute('name');

          if (!name) {
            name = target.parentNode.getAttribute('name');
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
        elem = new StatisticElem(type, name, event.value, timestamp, playerpos
        );
      }

      if (elem) {
        this._elements.push(elem);
        this.afteradd.emit(elem);
      }
    }
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
}
