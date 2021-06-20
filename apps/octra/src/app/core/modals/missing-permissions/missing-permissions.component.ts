import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {SubscriptionManager} from '@octra/utilities';
import {MdbModalRef} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-missing-permissions-modal',
  templateUrl: './missing-permissions.component.html',
  styleUrls: ['./missing-permissions.component.scss']
})
export class MissingPermissionsModalComponent implements OnDestroy {
  public visible = false;

  @ViewChild('modal', {static: true}) modal: any;
  @ViewChild('content', {static: false}) contentElement: ElementRef;

  protected data = undefined;
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager<Subscription>();

  constructor(public modalRef: MdbModalRef<MissingPermissionsModalComponent>) {
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
