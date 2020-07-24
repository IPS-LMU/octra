import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'procent',
  pure: false
})
export class ProcentPipe implements PipeTransform {
  transform(value: any): any {
    return (value && value > -1) ? Math.round(value * 100) : 0;
  }
}
