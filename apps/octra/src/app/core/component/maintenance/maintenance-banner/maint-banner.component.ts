import {Component, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChanges} from '@angular/core';
import {MaintenanceAPI, MaintenanceNotification} from '../maintenance-api';
import {HttpClient} from '@angular/common/http';
import * as moment from 'moment';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'maint-banner',
  templateUrl: './maint-banner.component.html',
  styleUrls: ['./maint-banner.component.css']
})
export class MaintenanceBannerComponent implements OnInit, OnChanges {

  @Input('serverURL') serverURL: string;
  @Input('language') language: string = null;

  notification: MaintenanceNotification;
  parsedNotification: MaintenanceNotification;

  constructor(private http: HttpClient, private renderer: Renderer2, private elementRef: ElementRef) {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    const isServerURL = changes.hasOwnProperty('serverURL') &&
      (changes.serverURL.currentValue !== null && changes.serverURL.currentValue !== undefined);

    const isLanguage = changes.hasOwnProperty('language') &&
      (changes.language.currentValue !== null && changes.language.currentValue !== undefined);

    if (isServerURL) {
      const api = new MaintenanceAPI(changes.serverURL.currentValue, this.http);
      api.readMaintenanceNotifications(72).then((notification) => {
        this.notification = notification;
        this.parseNotification();
      }).catch(() => {
        // ignore
      });
    }

    if (isLanguage) {
      this.parseNotification();
    }
  }

  private parseNotification() {
    if (this.notification) {
      moment.locale((this.language !== null && this.language !== undefined) ? this.language : 'en');
      const notification = {
        ...this.notification
      };

      notification.begin = moment(notification.begin).format('L LT');
      notification.end = moment(notification.end).format('L LT');
      this.parsedNotification = notification;

      if (this.language && this.serverURL) {
        this.renderer.setStyle(this.elementRef.nativeElement, 'display', 'inherit');
      }
    }
  }

}
