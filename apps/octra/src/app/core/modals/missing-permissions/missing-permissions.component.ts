import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {SubscriptionManager} from '@octra/utilities';
import {MdbModalRef} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-missing-permissions-modal',
  templateUrl: './missing-permissions.component.html',
  styleUrls: ['./missing-permissions.component.css']
})
export class MissingPermissionsModalComponent implements OnDestroy {
  modalRef: MdbModalRef<MissingPermissionsModalComponent>;
  public visible = false;

  @ViewChild('modal', {static: true}) modal: any;
  @ViewChild('content', {static: false}) contentElement: ElementRef;

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

  reload() {
    document.location.reload(true);
  }
}
