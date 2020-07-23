import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'cliptext'
})
export class ClipTextPipe implements PipeTransform {

  transform(value: string, ...args: any[]): any {
    if (value.length > 30) {
      return value.substring(0, 30) + '...';
    }
    return value;
  }

}
