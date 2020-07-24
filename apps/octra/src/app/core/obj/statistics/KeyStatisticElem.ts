import {StatisticElem} from './StatisticElement';

/***
 * Statistic Element Class
 */
export class KeyStatisticElem extends StatisticElem {
  get value(): string {
    return this.data.value;
  }

  constructor(type: string,
              name: string,
              value: any,
              timestamp: number,
              playpos: number,
              caretpos: number,
              selection: {
                start: number,
                length: number
              },
              segment: {
                start: number,
                length: number
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

  public static fromAny(elem: any): KeyStatisticElem {
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
          || elem.hasOwnProperty('type') || elem.hasOwnProperty('keyCode') || elem.hasOwnProperty('shiftPressed')
          || elem.hasOwnProperty('ctrlPressed') || elem.hasOwnProperty('altPressed') || elem.hasOwnProperty('char')
          || elem.hasOwnProperty('playpos') || elem.hasOwnProperty('playerpos') || elem.hasOwnProperty('caretpos')
          || elem.hasOwnProperty('control')
        ) {
          if (attr === 'playerpos') {
            result.playpos = elem[`${attr}`];
          } else {
            result[`${attr}`] = elem[`${attr}`];
          }
        }
      }
    }

    return new KeyStatisticElem(result.type, result.context, result.value, result.timestamp,
      result.playpos, result.caretpos, result.selection, result.segment);
  }
}
