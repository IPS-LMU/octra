import { getProperties, hasProperty } from '@octra/utilities';
import { ILog, SampleInterval } from '../Settings/logging';
import { StatisticElem } from './StatisticElement';

/***
 * Statistic Element Class
 */
export class KeyStatisticElem extends StatisticElem {
  override get value(): string {
    return this.data.value;
  }

  constructor(
    type: string,
    name: string,
    value: any,
    timestamp: number,
    playpos?: number,
    textSelection?: {
      start?: number;
      end?: number;
    },
    audioSelection?: SampleInterval,
    transcriptionUnit?: SampleInterval,
  ) {
    super(
      type,
      name,
      value,
      timestamp,
      playpos,
      audioSelection,
      transcriptionUnit,
    );
    this.data = {
      timestamp,
      type,
      context: name,
      value,
      playpos,
      textSelection,
      audioSelection,
      transcriptionUnit,
    };
  }

  public static override fromAny(elem: ILog): KeyStatisticElem {
    const result = {
      value: undefined,
      context: undefined,
      timestamp: undefined,
      type: undefined,
      playpos: undefined,
      textSelection: undefined,
      audioSelection: undefined,
      transcriptionUnit: undefined,
    };

    for (const [name] of getProperties(elem)) {
      if (
        hasProperty(elem, 'value') ||
        hasProperty(elem, 'context') ||
        hasProperty(elem, 'timestamp') ||
        hasProperty(elem, 'type') ||
        hasProperty(elem, 'keyCode') ||
        hasProperty(elem, 'shiftPressed') ||
        hasProperty(elem, 'ctrlPressed') ||
        hasProperty(elem, 'altPressed') ||
        hasProperty(elem, 'char') ||
        hasProperty(elem, 'playpos') ||
        hasProperty(elem, 'playerpos') ||
        hasProperty(elem, 'textSelection') ||
        hasProperty(elem, 'control')
      ) {
        if (name === 'playerpos') {
          result.playpos = (elem as any)[`${name}`];
        } else {
          (result as any)[`${name}`] = (elem as any)[`${name}`];
        }
      }
    }

    return new KeyStatisticElem(
      result.type!,
      result.context!,
      result.value,
      result.timestamp!,
      result.playpos,
      result.textSelection,
      result.audioSelection,
      result.transcriptionUnit,
    );
  }
}
