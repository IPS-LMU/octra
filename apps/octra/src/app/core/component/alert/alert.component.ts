import { Component, SecurityContext, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  fadeInOnEnterAnimation,
  fadeOutOnLeaveAnimation,
} from 'angular-animations';
import { interval, Subscription } from 'rxjs';
import { DynComponentDirective } from '../../shared/directive/dyn-component.directive';
import { AlertEntry, AlertService } from '../../shared/service/alert.service';
import { DefaultComponent } from '../default.component';

@Component({
  selector: 'octra-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  animations: [fadeInOnEnterAnimation(), fadeOutOnLeaveAnimation()],
})
export class AlertComponent extends DefaultComponent {
  @ViewChild(DynComponentDirective, { static: false })
  appDynComponent: DynComponentDirective;

  public duration = 20;
  public animation = 'closed';

  private counter: Subscription;

  public get queue(): AlertEntry[] {
    return this.alertService.queue;
  }

  constructor(
    private alertService: AlertService,
    private sanitizer: DomSanitizer
  ) {
    super();
    this.counter = interval(1000).subscribe(() => {
      for (const queueItem of this.alertService.queue) {
        queueItem.duration--;
        if (queueItem.duration === 0) {
          queueItem.animation = 'closed';
          this.removeFromQueue(queueItem);
        }
      }
    });
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.counter.unsubscribe();
  }

  onClose(entry: AlertEntry) {
    this.removeFromQueue(entry);
  }

  public clear() {
    for (const queueItem of this.queue) {
      queueItem.animation = 'closed';
    }

    this.animation = 'closed';
    setTimeout(() => {
      this.alertService.queue = [];
    }, 500);
  }

  public validate(message: string): SafeHtml {
    return this.sanitizer.sanitize(SecurityContext.HTML, message);
  }

  public afterComponentInitialized(item: { id: number; instance: any }) {
    this.alertService.alertInitialized.emit({
      id: item.id,
      component: item.instance,
    });
  }

  afterComponentDestroyed(item: { id: number }) {
    console.log(`alert with id ${item.id}`);
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
}
