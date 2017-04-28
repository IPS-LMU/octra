import {StatisticElem} from './StatisticElement';
import {Functions} from './Functions';
/***
 * Statistic Element Class
 */
export class KeyStatisticElem extends StatisticElem {
  get char(): string {
    return this.data.char;
  }

  set shortcode(value: string) {
    this.data.shortcode = value;
  }

  get shortcode(): string {
    return this.data.shortcode;
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

  public static fromAny(elem: any): KeyStatisticElem {
    const validation = Functions.equalProperties({
      value: null,
      target_name: null,
      timestamp: null,
      type: null,
      keyCode: null,
      shiftPressed: null,
      ctrlPressed: null,
      altPressed: null,
      char: null
    }, elem);

    if (!validation || !Functions.contains(elem.type, 'key')) {
      return null;
    }

    return new KeyStatisticElem(elem.type, elem.target_name, elem.value, elem.timestamp,
      elem.keyCode, elem.shift_pressed, elem.ctrlPressed, elem.altPressed);
  }

  constructor(type: string,
              name: string,
              value: any,
              timestamp: number,
              keyCode: number,
              shiftPressed: boolean,
              ctrlPressed: boolean,
              altPressed: boolean) {
    super(type, name, value, timestamp);
    this.data = {
      value: String.fromCharCode(keyCode),
      target_name: name,
      timestamp: timestamp,
      type: type,
      keyCode: keyCode,
      shiftPressed: shiftPressed,
      ctrlPressed: ctrlPressed,
      altPressed: altPressed,
      char: String.fromCharCode(keyCode)
    };
  }

  public getDataClone(): any {
    return {
      value: this.value,
      target_name: this.target_name,
      timestamp: this.timestamp,
      type: this.type,
      keyCode: this.keyCode,
      shiftPressed: this.shiftPressed,
      ctrlPressed: this.ctrlPressed,
      altPressed: this.altPressed,
      char: this.value
    };
  }
}
