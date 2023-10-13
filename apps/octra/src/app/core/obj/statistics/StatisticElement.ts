/***
 * Statistic Element Class
 */
import { ILog, SampleInterval } from '../Settings/logging';
import { getProperties, hasProperty } from '@octra/utilities';

export class StatisticElem {
  protected data: any = {
    timestamp: undefined,
    type: undefined,
    context: undefined,
    value: undefined,
    audioSelection: undefined,
  };

  get audioSelection(): SampleInterval {
    return this.data.audioSelection;
  }

  set audioSelection(value: SampleInterval) {
    this.data.audioSelection = value;
  }

  get transcriptionUnit(): SampleInterval {
    return this.data.transcriptionUnit;
  }

  set transcriptionUnit(value: SampleInterval) {
    this.data.transcriptionUnit = value;
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

  get textSelection(): { start?: number; end?: number } | undefined {
    return this.data.textSelection;
  }

  constructor(
    type: string,
    context: string,
    value: any,
    timestamp: number,
    playpos?: number,
    audioSelection?: SampleInterval,
    transcriptionUnit?: SampleInterval
  ) {
    this.data.type = type;
    this.data.context = context;
    this.data.timestamp = timestamp;
    this.data.value = value;
    if (!(playpos === undefined || playpos === null)) {
      this.data.playpos = playpos;
    }
    this.data.audioSelection = audioSelection;
    this.data.transcriptionUnit = transcriptionUnit;
  }

  public static fromAny(elem: ILog): StatisticElem {
    const result = {
      value: undefined,
      context: undefined,
      timestamp: undefined,
      type: undefined,
      playpos: undefined,
      audioSelection: undefined,
      transcriptionUnit: undefined,
    };

    for (const [name, value] of getProperties(elem)) {
      if (
        hasProperty(elem, 'value') ||
        hasProperty(elem, 'context') ||
        hasProperty(elem, 'timestamp') ||
        hasProperty(elem, 'type') ||
        hasProperty(elem, 'playpos') ||
        hasProperty(elem, 'playerpos') ||
        hasProperty(elem, 'textSelection')
      ) {
        if (name === 'playerpos') {
          result.playpos = value;
        } else {
          (result as any)[`${name}`] = (elem as any)[`${name}`];
        }
      }
    }

    return new StatisticElem(
      result.type!,
      result.context!,
      result.value,
      result.timestamp!,
      result.playpos,
      result.audioSelection,
      result.transcriptionUnit
    );
  }

  public getDataClone(): ILog {
    return {
      ...this.data,
    };
  }
}
