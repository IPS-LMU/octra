import {EventEmitter, Injectable} from '@angular/core';
import {StatisticElem} from '../../obj/statistics/StatisticElement';
import {KeyStatisticElem} from '../../obj/statistics/KeyStatisticElem';
import {MouseStatisticElem} from '../../obj/statistics/MouseStatisticElem';
import {Functions, isNullOrUndefined} from '../Functions';
import {OLog} from '../../obj/Settings/logging';
import {BrowserAudioTime} from '../../../media-components/obj/media/audio';

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
  public addElementFromEvent(type: string, event: any, timestamp: number, playerpos: BrowserAudioTime, caretpos: number,
                             targetName?: string, segment?: {
      start: number,
      length: number,
      textlength: number
    }) {
    this._lastAction = Date.now();
    const originalPlayerPos = (!isNullOrUndefined(playerpos)) ? playerpos.originalSample.value : -1;

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

      if (!targetName) {
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
        name = targetName;
      }
      let elem = null;
      if (Functions.contains(type, 'key') || Functions.contains(type, 'shortcut')) {
        elem = new KeyStatisticElem(
          type,
          name,
          event.value,
          timestamp,
          (!isNullOrUndefined(playerpos)) ? playerpos.originalSample.value : -1,
          caretpos,
          segment
        );
      } else if (Functions.contains(type, 'mouse')) {
        elem = new MouseStatisticElem(type, name, event.value, timestamp, originalPlayerPos, caretpos, segment);
      } else if (Functions.contains(type, 'slider')) {
        elem = new MouseStatisticElem(type, name, event.new_value, timestamp, originalPlayerPos, caretpos, segment);
      } else {
        elem = new StatisticElem(type, name, event.value, timestamp, originalPlayerPos);
      }

      if (elem) {
        this._elements.push(elem);
        this._afteradd.emit(elem);
        const newElem = new OLog(
          elem.timestamp,
          elem.type,
          elem.context,
          '',
          elem.playerpos,
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
    for (let i = 0; i < array.length; i++) {
      const elem = array[i];
      let newElem = null;

      if (newElem) {
      } else {
        newElem = MouseStatisticElem.fromAny(elem);
        if (newElem) {
        } else {
          newElem = StatisticElem.fromAny(elem);
          if (newElem) {
          }

        }
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

    for (let i = 0; i < this._elements.length; i++) {
      const elem = this._elements[i];

      if (elem instanceof type) {
        result.push(elem);
      }
    }

    return result;
  }
}
