import {StatisticElem} from './StatisticElement';

/***
 * Statistic Element Class
 */
export class KeyStatisticElem extends StatisticElem {
  get char(): string {
    return this.data.char;
  }

  get value(): string {
    return this.data.value;
  }

  get keyCode(): number {
    return this.data.keyCode;
  }

  get shiftPressed(): number {
    return this.data.shiftPressed;
  }

  get ctrlPressed(): number {
    return this.data.ctrlPressed;
  }

  get altPressed(): number {
    return this.data.altPressed;
  }

  constructor(type: string,
              name: string,
              value: any,
              timestamp: number,
              playpos: number,
              caretpos: number, segment: {
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

  public static fromAny(elem: any): KeyStatisticElem {
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
          || elem.hasOwnProperty('type') || elem.hasOwnProperty('keyCode') || elem.hasOwnProperty('shiftPressed')
          || elem.hasOwnProperty('ctrlPressed') || elem.hasOwnProperty('altPressed') || elem.hasOwnProperty('char')
          || elem.hasOwnProperty('playpos') || elem.hasOwnProperty('playerpos') || elem.hasOwnProperty('caretpos') || elem.hasOwnProperty('control')
        ) {
          if (attr === 'playerpos') {
            result['playpos'] = elem[`${attr}`];
          } else {
            result[`${attr}`] = elem[`${attr}`];
          }
        }
      }
    }

    return new KeyStatisticElem(result.type, result.context, result.value, result.timestamp,
      result.playpos, result.caretpos, result.segment);
  }
}
