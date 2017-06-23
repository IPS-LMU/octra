import {Functions} from '../shared/Functions';
/***
 * Statistic Element Class
 */
export class StatisticElem {
  get value(): any {
    return this.data.value;
  }

  get timestamp(): number {
    return this.data.timestamp;
  }

  get target_name(): string {
    return this.data.target_name;
  }

  get type(): string {
    return this.data.type;
  }

  protected data: any = {
    value: null,
    target_name: null,
    timestamp: null,
    type: null
  };

  public static fromAny(elem: any) {
    const validation = Functions.equalProperties(
      {
        value: null,
        target_name: null,
        timestamp: null,
        type: null
      }, elem);

    if (!validation) {
      return null;
    }

    return new StatisticElem(
      elem.type,
      elem.target_name,
      elem.value,
      elem.timestamp
    );
  }

  constructor(type: string,
              target_name: string,
              value: any,
              timestamp: number) {
    this.data.type = type;
    this.data.target_name = target_name;
    this.data.timestamp = timestamp;
    this.data.value = value;
  }

  public getDataClone(): any {
    return {
      value: this.value,
      target_name: this.target_name,
      timestamp: this.timestamp,
      type: this.type
    };
  }
}
