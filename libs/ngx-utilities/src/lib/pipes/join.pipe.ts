import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'join',
})
export class JoinPipe implements PipeTransform {
  transform(
    value: string[],
    options: {
      separator: string;
    }
  ): string {
    return value.join(options.separator);
  }
}
