import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'map',
})
export class MapPipe implements PipeTransform {
  transform(
    value: any[],
    options: {
      func: (a: any) => any;
    },
  ): any[] {
    return value.map(options.func) as any[];
  }
}
