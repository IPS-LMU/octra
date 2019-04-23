import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';

import {MessageService} from '../../shared/service';
import {OCTRANIMATIONS} from '../../shared';
import {SubscriptionManager} from '../../obj/SubscriptionManager';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css'],
  animations: OCTRANIMATIONS,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertComponent implements OnInit, OnDestroy {

  constructor(private cd: ChangeDetectorRef,
              private msgService: MessageService) {
    this.subscrmanager = new SubscriptionManager();
  }

  public type = 'error';
  private state = 'inactive';
  private text = '';
  private show = false;
  private subscrmanager: SubscriptionManager;

  /**
   * show alert on the right top corner of the screen.
   * @param type "log", "error" or "info"
   * @param message Message which should be shown
   */
  public showMessage = (type: string, message: string) => {
    this.show = true;
    this.state = 'active';
    this.type = type;
    this.text = message;
    this.cd.markForCheck();

    setTimeout(() => {
      this.state = 'inactive';
      this.cd.markForCheck();
    }, 3000);
  }

  ngOnInit() {
    this.state = 'inactive';
    this.show = false;

    this.cd.markForCheck();
    this.subscrmanager.add(this.msgService.showmessage.subscribe(
      (result) => {
        this.showMessage(result.type, result.message);
      }
    ));
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }
}
