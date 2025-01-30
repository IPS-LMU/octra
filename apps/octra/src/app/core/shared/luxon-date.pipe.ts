import { Pipe, PipeTransform } from '@angular/core';
import { DateTime } from 'luxon';

@Pipe({
  name: 'luxonShortDateTime',
  standalone: true,
})
export class LuxonShortDateTimePipe implements PipeTransform {
  constructor() {}

  transform(
    value: string | Date | DateTime | number | undefined,
    options: { locale: string | undefined }
  ): unknown {
    if (!value) {
      return '';
    }

    let dateTime: DateTime;

    if (value instanceof Date) {
      dateTime = DateTime.fromJSDate(value);
    } else if (value instanceof DateTime) {
      dateTime = value;
    } else if (typeof value === 'string') {
      dateTime = DateTime.fromISO(value);
    } else {
      dateTime = DateTime.fromMillis(value);
    }

    const loc = options.locale ?? 'en-GB';
    return dateTime.toLocaleString(
      {
        ...DateTime.DATETIME_SHORT,
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      },
      {
        locale: loc,
      }
    );
  }
}
