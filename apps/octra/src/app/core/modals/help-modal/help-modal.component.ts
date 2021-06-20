import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {SubscriptionManager} from '@octra/utilities';
import {MdbModalConfig, MdbModalRef} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-help-modal',
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.css']
})
export class HelpModalComponent implements OnDestroy {
  modalRef: MdbModalRef<HelpModalComponent>;
  public visible = false;

  @ViewChild('modal', {static: true}) modal: any;
  @ViewChild('content', {static: false}) contentElement: ElementRef;

  public config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true,
    modalClass: 'modal-lg'
  };
  protected data = undefined;
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager<Subscription>();

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal);
      this.visible = true;

      const subscr = this.actionperformed.subscribe(
        (action) => {
          resolve(action);
          subscr.unsubscribe();
        },
        (err) => {
          reject(err);
        }
      );

    });
  }

  public close() {
    this.modal.hide();

    this.actionperformed.next();
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  onHidden() {
    this.visible = false;
    this.subscrmanager.destroy();
  }
}
