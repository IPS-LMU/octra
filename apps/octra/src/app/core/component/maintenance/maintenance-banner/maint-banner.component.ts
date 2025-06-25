import { HttpClient } from '@angular/common/http';
import {
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { hasProperty } from '@octra/utilities';
import { DateTime } from 'luxon';
import { MaintenanceAPI, MaintenanceNotification } from '../maintenance-api';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'octra-maint-banner',
  templateUrl: './maint-banner.component.html',
  styleUrls: ['./maint-banner.component.scss'],
  imports: [TranslocoPipe],
})
export class MaintenanceBannerComponent implements OnChanges {
  private http = inject(HttpClient);
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);

  @Input() serverURL!: string;
  @Input() language?: string;

  notification?: MaintenanceNotification;
  parsedNotification?: MaintenanceNotification;

  ngOnChanges(changes: SimpleChanges) {
    const isServerURL =
      hasProperty(changes, 'serverURL') &&
      changes['serverURL'].currentValue !== undefined;

    const isLanguage =
      hasProperty(changes, 'language') &&
      changes['language'].currentValue !== undefined;

    if (isServerURL) {
      const api = new MaintenanceAPI(
        changes['serverURL'].currentValue,
        this.http,
      );
      api
        .readMaintenanceNotifications(72)
        .then((notification) => {
          this.notification = notification;
          this.parseNotification();
        })
        .catch(() => {
          // ignore
        });
    }

    if (isLanguage) {
      this.parseNotification();
    }
  }

  private parseNotification() {
    if (this.notification) {
      const language = this.language !== undefined ? this.language : 'en';

      const notification = {
        ...this.notification,
      };

      const begin = DateTime.fromISO(notification.begin).setLocale(language);
      const end = DateTime.fromISO(notification.end).setLocale(language);

      notification.begin = begin.toLocaleString(DateTime.DATETIME_SHORT);
      notification.end = end.toLocaleString(DateTime.DATETIME_SHORT);
      this.parsedNotification = notification;

      if (this.language && this.serverURL) {
        this.renderer.setStyle(
          this.elementRef.nativeElement,
          'display',
          'inherit',
        );
      }
    }
  }
}
