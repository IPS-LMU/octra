import {StatisticElem} from './StatisticElement';

/***
 * Statistic Element Class
 */
export class MouseStatisticElem extends StatisticElem {
  public static fromAny(elem: any): MouseStatisticElem {
    const result = {
      value: null,
      target: null,
      timestamp: null,
      type: null,
      playerpos: -1,
      caretpos: -1
    };

    for (const attr in elem) {
      if (elem.hasOwnProperty(attr)) {
        if (elem.hasOwnProperty('value') || elem.hasOwnProperty('target') || elem.hasOwnProperty('timestamp')
          || elem.hasOwnProperty('type') || elem.hasOwnProperty('playerpos') || elem.hasOwnProperty('caretpos')
        ) {
          result[`${attr}`] = elem[`${attr}`];
        }
      }
    }

    return new MouseStatisticElem(result.type, result.target,
      result.value, result.timestamp, result.playerpos, result.caretpos);
  }

  constructor(type: string,
              name: string,
              value: string,
              timestamp: number,
              playerpos: number,
              caretpos: number) {
    super(type, name, value, timestamp, playerpos);

    this.data = {
      timestamp: timestamp,
      type: type,
      target: name,
      value: value,
      playerpos: playerpos,
      caretpos: caretpos
    };
  }
}