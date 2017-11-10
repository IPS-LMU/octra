import {StatisticElem} from './StatisticElement';

/***
 * Statistic Element Class
 */
export class MouseStatisticElem extends StatisticElem {
  public static fromAny(elem: any): MouseStatisticElem {
    const result = {
      value: null,
      context: null,
      timestamp: null,
      type: null,
      playerpos: -1,
      caretpos: -1,
      segment: {
        start: -1,
        length: -1,
        textlength: -1
      }
    };

    for (const attr in elem) {
      if (elem.hasOwnProperty(attr)) {
        if (elem.hasOwnProperty('value') || elem.hasOwnProperty('context') || elem.hasOwnProperty('timestamp')
          || elem.hasOwnProperty('type') || elem.hasOwnProperty('playerpos') || elem.hasOwnProperty('caretpos')
          || elem.hasOwnProperty('segment')
        ) {
          result[`${attr}`] = elem[`${attr}`];
        }
      }
    }

    return new MouseStatisticElem(result.type, result.context,
      result.value, result.timestamp, result.playerpos, result.caretpos, result.segment);
  }

  constructor(type: string,
              name: string,
              value: string,
              timestamp: number,
              playerpos: number,
              caretpos: number,
              segment: {
                start: number,
                length: number,
                textlength: number
              }) {
    super(type, name, value, timestamp, playerpos);

    this.data = {
      timestamp: timestamp,
      type: type,
      context: name,
      value: value,
      playerpos: playerpos,
      caretpos: caretpos,
      segment: segment
    };
  }
}
