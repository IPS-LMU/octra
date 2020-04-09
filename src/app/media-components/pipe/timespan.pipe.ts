import {Pipe, PipeTransform} from '@angular/core';
import {isSet} from '../../core/shared/Functions';

@Pipe({
  name: 'timespan',
  pure: false
})
export class TimespanPipe implements PipeTransform {

  private timespan = 0;
  private FormatNumber = (num, length): string => {
    let result = '' + num.toFixed(0);
    while (result.length < length) {
      result = '0' + result;
    }
    return result;
  };

  private get MiliSeconds(): number {
    return Math.floor(this.timespan % 1000);
  }

  private get Seconds(): number {
    return Math.floor(this.timespan / 1000) % 60;
  }

  private get Minutes(): number {
    return Math.floor(this.timespan / 1000 / 60) % 60;
  }

  private get Hours(): number {
    return Math.floor(this.timespan / 1000 / 60 / 60);
  }

  transform(value: any, args?: [boolean, boolean, boolean]): any {
    this.timespan = Number(value);
    if (this.timespan < 0) {
      this.timespan = 0;
    }

    let result = '';

    const options = (isSet(args)) ? [false, false, false] : args;

    const miliSeconds: string = this.formatNumber(this.MiliSeconds, 3);
    const minutes: string = this.formatNumber(this.Minutes, 2);
    const seconds: string = this.formatNumber(this.Seconds, 2);
    const hours: string = (options[0] && (!options[1] || (options[1] && this.Hours > 0))) ? this.formatNumber(this.Hours, 2) + ':' : '';

    result += hours + minutes + ':' + seconds;
    if (options[1]) {
      result += '.' + miliSeconds;
    }

    return result;
  }

  private formatNumber = (num, length): string => {
    let result = '' + num.toFixed(0);
    while (result.length < length) {
      result = '0' + result;
    }
    return result;
  }

}
