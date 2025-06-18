import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'leadingnull',
  pure: false,
})
export class LeadingNullPipe implements PipeTransform {
  transform(value: any, maxnum: number): any {
    const maxNumDigits = maxnum.toString().length;
    const valueDigits = value.toString().length;
    let result = '';

    for (let i = 0; i < maxNumDigits - valueDigits; i++) {
      result += '0';
    }

    return `${result}${value}`;
  }
}
