import {StatisticElem} from './StatisticElement';
import {ILog} from '../Settings/logging';
import {hasProperty} from '@octra/utilities';

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

  public static fromAny(elem: ILog): KeyStatisticElem {
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

    for (const [name,] of Object.entries(elem)) {
      if (hasProperty(elem, 'value') || hasProperty(elem, 'context') || hasProperty(elem, 'timestamp')
        || hasProperty(elem, 'type') || hasProperty(elem, 'keyCode') || hasProperty(elem, 'shiftPressed')
        || hasProperty(elem, 'ctrlPressed') || hasProperty(elem, 'altPressed') || hasProperty(elem, 'char')
        || hasProperty(elem, 'playpos') || hasProperty(elem, 'playerpos') || hasProperty(elem, 'caretpos')
        || hasProperty(elem, 'control')
      ) {
        if (name === 'playerpos') {
          result.playpos = elem[`${name}`];
        } else {
          result[`${name}`] = elem[`${name}`];
        }
      }
    }

    return new KeyStatisticElem(result.type, result.context, result.value, result.timestamp,
      result.playpos, result.caretpos, result.selection, result.segment);
  }
}
