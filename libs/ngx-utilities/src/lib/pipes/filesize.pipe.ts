import { Pipe, PipeTransform } from '@angular/core';
import { getFileSize } from '@octra/utilities';

@Pipe({
  name: 'filesize',
})
export class FileSizePipe implements PipeTransform {
  transform(value: number): string {
    const filesize = getFileSize(value);

    return `${filesize.size} ${filesize.label}`;
  }
}
