import {StatisticElem} from './StatisticElement';

/***
 * Statistic Element Class
 */
export class MouseStatisticElem extends StatisticElem {
  constructor(type: string,
              name: string,
              value: string,
              timestamp: number,
              playpos: number,
              caretpos: number,
              segment: {
                start: number,
                length: number,
                textlength: number
              }) {
    super(type, name, value, timestamp, playpos);

    this.data = {
      timestamp,
      type,
      context: name,
      value,
      playpos,
      caretpos,
      segment
    };
  }

  public static fromAny(elem: any): MouseStatisticElem {
    const result = {
      value: null,
      context: null,
      timestamp: null,
      type: null,
      playpos: -1,
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
          || elem.hasOwnProperty('type') || elem.hasOwnProperty('playpos') || elem.hasOwnProperty('playerpos') || elem.hasOwnProperty('caretpos')
          || elem.hasOwnProperty('segment')
        ) {
          if (attr === 'playerpos') {
            result['playpos'] = elem[`${attr}`];
          } else {
            result[`${attr}`] = elem[`${attr}`];
          }
        }
      }
    }

    return new MouseStatisticElem(result.type, result.context,
      result.value, result.timestamp, result.playpos, result.caretpos, result.segment);
  }
}
