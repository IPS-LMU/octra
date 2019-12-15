import {StatisticElem} from './StatisticElement';
import {KeyStatisticElem} from './KeyStatisticElem';

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
              selection: {
                start: number;
                length: number;
              },
              segment: {
                start: number;
                length: number;
              }) {
    super(type, name, value, timestamp, playpos, selection, segment);

    this.data = {
      timestamp,
      type,
      context: name,
      value,
      playpos,
      caretpos,
      selection,
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
      selection: null,
      segment: null
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
      result.value, result.timestamp, result.playpos, result.caretpos, result.selection, result.segment);
  }
}
