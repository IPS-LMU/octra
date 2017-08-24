/***
 * Statistic Element Class
 */
import {ILog} from '../Settings/logging';
import {isNullOrUndefined} from 'util';

export class StatisticElem {
  get value(): any {
    return this.data.value;
  }

  set value(value: any) {
    this.data.value = value;
  }

  get timestamp(): number {
    return this.data.timestamp;
  }

  get target(): string {
    return this.data.target;
  }

  get type(): string {
    return this.data.type;
  }

  get playerpos(): number {
    return this.data.playerpos;
  }

  get caretpos(): number {
    return this.data.caretpos;
  }

  protected data: any = {
    timestamp: null,
    type: null,
    target: null,
    value: null
  };

  public static fromAny(elem: any): StatisticElem {
    const result = {
      value: null,
      target: null,
      timestamp: null,
      type: null,
      playerpos: null
    };

    for (const attr in elem) {
      if (elem.hasOwnProperty(attr)) {
        if (elem.hasOwnProperty('value') || elem.hasOwnProperty('target') || elem.hasOwnProperty('timestamp') ||
          elem.hasOwnProperty('type') || elem.hasOwnProperty('playerpos') || elem.hasOwnProperty('cursorpos')
        ) {
          result[`${attr}`] = elem[`${attr}`];
        }
      }
    }

    return new StatisticElem(
      result.type,
      result.target,
      result.value,
      result.timestamp,
      result.playerpos
    );
  }

  constructor(type: string, target: string, value: any, timestamp: number, playerpos: number) {
    this.data.type = type;
    this.data.target = target;
    this.data.timestamp = timestamp;
    this.data.value = value;
    if (!isNullOrUndefined(playerpos)) {
      this.data.playerpos = playerpos;
    }
  }

  public getDataClone(): ILog {
    return JSON.parse(JSON.stringify(this.data));
  }
}
