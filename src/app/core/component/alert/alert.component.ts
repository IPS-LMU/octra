import {Component, OnDestroy, OnInit, SecurityContext} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import {AlertService} from '../../shared/service/alert.service';
import {OCTRANIMATIONS} from '../../shared';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

export interface AlertEntry {
  type: 'danger' | 'warning' | 'info' | 'success';
  message: string;
  duration: number;
  animation: string;
  unique: boolean;
  id: number;
}

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css'],
  animations: OCTRANIMATIONS
})

export class AlertComponent implements OnInit, OnDestroy {

  private static counter = 0;
  public duration = 20;
  public queue: AlertEntry[] = [];
  public animation = 'closed';

  private counter: Subscription;

  constructor(private alert: AlertService, private sanitizer: DomSanitizer) {
    this.alert.alertsend.subscribe(
      obj => this.onAlertSend(obj),
      (err) => {
        console.error(err);
      }
    );

    this.counter = interval(1000).subscribe(
      () => {
        for (const queueItem of this.queue) {
          queueItem.duration--;
          if (queueItem.duration === 0) {
            queueItem.animation = 'closed';
            this.removeFromQueue(queueItem);
          }
        }
      }
    );
  }

  ngOnDestroy() {
    this.counter.unsubscribe();
  }

  onAlertSend(obj: {
    type: 'danger' | 'warning' | 'info' | 'success',
    message: string,
    duration: number,
    unique: boolean
  }) {
    this.animation = 'opened';
    if (obj.type === 'danger' || obj.type === 'warning' || obj.type === 'info' || obj.type === 'success') {
      const entry: AlertEntry = {
        type: obj.type,
        animation: 'opened',
        duration: obj.duration,
        message: obj.message,
        unique: obj.unique,
        id: ++AlertComponent.counter
      };

      const alreadyExists = this.queue.findIndex((a) => {
        return a.message === obj.message;
      }) > -1;

      if (!obj.unique || !alreadyExists) {
        this.queue.push(entry);
      }
    }
  }

  ngOnInit(): void {
  }

  onClose(entry: AlertEntry) {
    entry.animation = 'closed';
    this.removeFromQueue(entry);
  }

  public clear() {
    for (const queueItem of this.queue) {
      queueItem.animation = 'closed';
    }

    this.animation = 'closed';
    setTimeout(() => {
      this.queue = [];
    }, 1000);
  }

  private removeFromQueue(entry: AlertEntry) {
    let index = this.queue.findIndex((a) => {
      return a.id === entry.id;
    });

    if (index > -1) {
      if (this.queue.length <= 1) {
        this.animation = 'closed';
      }

      setTimeout(() => {
        index = this.queue.findIndex((a) => {
          return a.id === entry.id;
        });
        this.queue.splice(index, 1);
        if (this.queue.length === 0) {
          this.animation = 'closed';
        }
      }, 500);
    }
  }

  public validate(message: string): SafeHtml {
    return this.sanitizer.sanitize(SecurityContext.HTML, message);
  }
}
