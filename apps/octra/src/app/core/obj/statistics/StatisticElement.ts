/***
 * Statistic Element Class
 */
import {ILog, SampleInterval} from '../Settings/logging';

export class StatisticElem {
  protected data: {
    timestamp: number,
    type: string,
    context: string,
    value: any,
    selection?: SampleInterval,
    segment?: SampleInterval,
    playpos?: number;
    caretpos?: number;
  } = {
    timestamp: null,
    type: null,
    context: null,
    value: null
  };

  get selection(): SampleInterval {
    return this.data.selection;
  }

  set selection(value: SampleInterval) {
    this.data.selection = value;
  }

  get segment(): SampleInterval {
    return this.data.segment;
  }

  set segment(value: SampleInterval) {
    this.data.segment = value;
  }

  get value(): any {
    return this.data.value;
  }

  set value(value: any) {
    this.data.value = value;
  }

  get timestamp(): number {
    return this.data.timestamp;
  }

  get context(): string {
    return this.data.context;
  }

  get type(): string {
    return this.data.type;
  }

  get playpos(): number {
    return this.data.playpos;
  }

  get caretpos(): number {
    return this.data.caretpos;
  }

  constructor(
    type: string, context: string, value: any, timestamp: number, playpos: number, selection: SampleInterval,
    segment: SampleInterval
  ) {
    this.data.type = type;
    this.data.context = context;
    this.data.timestamp = timestamp;
    this.data.value = value;
    if (!(playpos === null || playpos === undefined)) {
      this.data.playpos = playpos;
    }
    this.data.selection = selection;
    this.data.segment = segment;
  }

  public static fromAny(elem: any): StatisticElem {
    const result = {
      value: null,
      context: null,
      timestamp: null,
      type: null,
      playpos: null,
      selection: null,
      segment: null
    };

    for (const attr in elem) {
      if (elem.hasOwnProperty(attr)) {
        if (elem.hasOwnProperty('value') || elem.hasOwnProperty('context') || elem.hasOwnProperty('timestamp') ||
          elem.hasOwnProperty('type') || elem.hasOwnProperty('playpos') || elem.hasOwnProperty('playerpos') ||
          elem.hasOwnProperty('cursorpos')
        ) {
          if (attr === 'playerpos') {
            result.playpos = elem[`${attr}`];
          } else {
            result[`${attr}`] = elem[`${attr}`];
          }
        }
      }
    }

    return new StatisticElem(
      result.type,
      result.context,
      result.value,
      result.timestamp,
      result.playpos,
      result.selection,
      result.segment
    );
  }

  public getDataClone(): ILog {
    return JSON.parse(JSON.stringify(this.data));
  }
}
