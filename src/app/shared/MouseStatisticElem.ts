import {StatisticElem} from './StatisticElement';
import {Functions} from './Functions';
/***
 * Statistic Element Class
 */
export class MouseStatisticElem extends StatisticElem {
  public static fromAny(elem: any): MouseStatisticElem {
    const validation = Functions.equalProperties({
      value: null,
      target_name: null,
      timestamp: null,
      type: null
    }, elem);

    if (!validation || !Functions.contains(elem.type, 'mouse')) {
      return null;
    }

    return new MouseStatisticElem(elem.type, elem.target_name, elem.value, elem.timestamp);
  }

  constructor(type: string,
              name: string,
              value: string,
              timestamp: number) {
    super(type, name, value, timestamp);

    this.data = {
      value: value,
      target_name: name,
      timestamp: timestamp,
      type: type
    };
  }

  public getDataClone(): any {
    return super.getDataClone();
  }
}
