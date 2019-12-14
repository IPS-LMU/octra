/***
 * Statistic Element Class
 */
import {ILog} from '../Settings/logging';

export class StatisticElem {
  protected data: any = {
    timestamp: null,
    type: null,
    context: null,
    value: null
  };

  get value(): any {
    return this.data.value;
  }

  set value(value: any) {
    this.data.value = value;
  }

  get timestamp(): number {
    return this.data.timestamp;
  }

  get context(): string {
    return this.data.context;
  }

  get type(): string {
    return this.data.type;
  }

  get playpos(): number {
    return this.data.playpos;
  }

  get caretpos(): number {
    return this.data.caretpos;
  }

  constructor(type: string, context: string, value: any, timestamp: number, playpos: number) {
    this.data.type = type;
    this.data.context = context;
    this.data.timestamp = timestamp;
    this.data.value = value;
    if (!(playpos === null || playpos === undefined)) {
      this.data.playpos = playpos;
    }
  }

  public static fromAny(elem: any): StatisticElem {
    const result = {
      value: null,
      context: null,
      timestamp: null,
      type: null,
      playpos: null
    };

    for (const attr in elem) {
      if (elem.hasOwnProperty(attr)) {
        if (elem.hasOwnProperty('value') || elem.hasOwnProperty('context') || elem.hasOwnProperty('timestamp') ||
          elem.hasOwnProperty('type') || elem.hasOwnProperty('playpos') || elem.hasOwnProperty('playerpos') || elem.hasOwnProperty('cursorpos')
        ) {
          if (attr === 'playerpos') {
            result['playpos'] = elem[`${attr}`];
          } else {
            result[`${attr}`] = elem[`${attr}`];
          }
        }
      }
    }

    return new StatisticElem(
      result.type,
      result.context,
      result.value,
      result.timestamp,
      result.playpos
    );
  }

  public getDataClone(): ILog {
    return JSON.parse(JSON.stringify(this.data));
  }
}
