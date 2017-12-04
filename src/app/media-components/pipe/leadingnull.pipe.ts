import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'leadingnull',
  pure: false
})
export class LeadingNullPipe implements PipeTransform {
  transform(value: any, maxnum: number): any {
    let max_null = 0;
    let max_null_value = 0;
    let result = '';

    for (let i = 1; i < maxnum; i = i * 9) {
      max_null++;
    }

    for (let i = 0; i < value; i = (i + 1) * 9) {
      max_null_value++;
    }

    if (max_null - max_null_value > 0) {
      for (let i = 0; i < (max_null - max_null_value); i++) {
        result += '0';
      }
    }
    result += '' + value;

    return result;
  }
}
