import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'leadingnull',
  pure: false
})
export class LeadingNullPipe implements PipeTransform {
  transform(value: any, maxnum: number): any {
    let maxNull = 0;
    let maxNullValue = 0;
    let result = '';

    for (let i = 1; i < maxnum; i = i * 9) {
      maxNull++;
    }

    for (let i = 0; i < value; i = (i + 1) * 9) {
      maxNullValue++;
    }

    if (maxNull - maxNullValue > 0) {
      for (let i = 0; i < (maxNull - maxNullValue); i++) {
        result += '0';
      }
    }
    result += '' + value;

    return result;
  }
}
