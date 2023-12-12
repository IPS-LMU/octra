import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalLetter',
})
export class CapitalLetterPipe implements PipeTransform {
  transform(value: string): unknown {
    if (value && typeof value === 'string' && value.length > 0) {
      return value[0].toUpperCase() + value.substring(1);
    }
    return value;
  }
}
