import {StatisticElem} from './StatisticElement';
import {ILog} from '../Settings/logging';
import {getProperties, hasProperty} from '@octra/utilities';

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

  public static override fromAny(elem: ILog): MouseStatisticElem {
    const result = {
      value: undefined,
      context: undefined,
      timestamp: undefined,
      type: undefined,
      playpos: -1,
      caretpos: -1,
      selection: undefined,
      segment: undefined
    };

    for (const [name] of getProperties(elem)) {
      if (hasProperty(elem, 'value') || hasProperty(elem, 'context') || hasProperty(elem, 'timestamp')
        || hasProperty(elem, 'type') || hasProperty(elem, 'playpos') || hasProperty(elem, 'playerpos')
        || hasProperty(elem, 'caretpos') || hasProperty(elem, 'segment')
      ) {
        if (name === 'playerpos') {
          result.playpos = elem[`${name}`];
        } else {
          result[`${name}`] = elem[`${name}`];
        }
      }
    }

    return new MouseStatisticElem(result.type, result.context,
      result.value, result.timestamp, result.playpos, result.caretpos, result.selection, result.segment);
  }
}
