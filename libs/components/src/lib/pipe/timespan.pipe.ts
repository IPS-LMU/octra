import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'timespan',
  pure: false
})
export class TimespanPipe implements PipeTransform {

  private timespan = 0;

  private get MilliSeconds(): number {
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

  /**
   * transforms milliseconds to time string
   * @param value number or milliseconds
   * @param args [showHour, showMilliSeconds]
   */
  transform(value: number, args?: {
    showHour?: boolean,
    showMilliSeconds?: boolean,
    maxDuration?: number
  }): any {
    this.timespan = Number(value);
    if (this.timespan < 0) {
      this.timespan = 0;
    }

    const defaultArgs = {
      showHour: false,
      showMilliSeconds: false,
      maxDuration: 0
    };

    args = {...defaultArgs, ...args};

    const forceHours = (Math.floor((args as any).maxDuration / 1000 / 60 / 60)) > 0;

    let result = '';

    const milliSeconds: string = this.formatNumber(this.MilliSeconds, 3);
    const minutes: string = this.formatNumber(this.Minutes, 2);
    const seconds: string = this.formatNumber(this.Seconds, 2);
    const hours: string = (args.showHour && (forceHours || this.Hours > 0)) ? this.formatNumber(this.Hours, 2) + ':' : '';

    result += hours + minutes + ':' + seconds;
    if (args.showMilliSeconds) {
      result += '.' + milliSeconds;
    }

    return result;
  }

  private formatNumber = (num: number, length: number): string => {
    let result = '' + num.toFixed(0);
    while (result.length < length) {
      result = '0' + result;
    }
    return result;
  }

}
