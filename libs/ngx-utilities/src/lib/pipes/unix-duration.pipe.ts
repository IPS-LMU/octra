import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unixDuration',
})
export class UnixDurationPipe implements PipeTransform {
  transform(value?: number): unknown {
    if (value !== undefined && value !== null) {
      const days = Math.floor(value / 60 / 60 / 24);
      const hour = Math.floor((value / 60 / 60) % 24);
      const minutes = Math.floor((value / 60) % 60);
      const seconds = Math.floor(value % 60);

      return `${days}d:${hour}h:${minutes}m:${seconds}s`;
    }
    return 'NA';
  }
}
