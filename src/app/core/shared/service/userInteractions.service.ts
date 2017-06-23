import {EventEmitter, Injectable} from '@angular/core';
import 'rxjs/Rx';
import {StatisticElem} from '../../obj/StatisticElement';
import {KeyStatisticElem} from '../../obj/KeyStatisticElem';
import {MouseStatisticElem} from '../../obj/MouseStatisticElem';
import {KeyMapping} from '../';
import {Functions} from '../Functions';

@Injectable()
export class UserInteractionsService {
  private _elements: StatisticElem[];
  public afteradd: EventEmitter<StatisticElem> = new EventEmitter<StatisticElem>();

  get elements(): StatisticElem[] {
    return this._elements;
  }

  set elements(value: StatisticElem[]) {
    this._elements = value;
  }

  constructor() {
    this._elements = [];
  }

  /**
   * Parse Events
   * @param type
   * @param event
   */
  public addElementFromEvent(type: string, event: any, timestamp: number, target_name?: string) {
    let name = '';
    let target: any = null;

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
    if (Functions.contains(type, 'key')) {
      elem = new KeyStatisticElem(
        event.type,
        name,
        '',
        timestamp,
        event.which,
        event.shiftKey,
        event.ctrlKey,
        event.altKey
      );
      elem.shortcode = KeyMapping.getShortcutCombination(event);
    } else if (Functions.contains(type, 'mouse')) {
      elem = new MouseStatisticElem(
        type,
        name,
        '',
        timestamp
      );
    } else if (Functions.contains(type, 'slider')) {
      elem = new MouseStatisticElem('mouse_slider', name, event.new_value, timestamp
      );
    } else {
      elem = new StatisticElem(type, name, event.value, timestamp
      );
    }

    if (elem) {
      this._elements.push(elem);
      this.afteradd.emit(elem);
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

      new_elem = KeyStatisticElem.fromAny(elem);
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
