import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'seconds',
  pure: false
})
export class SecondsPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    return (value && value > -1) ? Math.round(value * 100) / 100 : 0;
  }
}
