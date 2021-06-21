import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs';
import {SubscriptionManager} from '@octra/utilities';
import {MdbModalRef} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-missing-permissions-modal',
  templateUrl: './missing-permissions.component.html',
  styleUrls: ['./missing-permissions.component.scss']
})
export class MissingPermissionsModalComponent implements OnDestroy {
  @ViewChild('content', {static: false}) contentElement: ElementRef;

  protected data = undefined;
  private subscrmanager = new SubscriptionManager<Subscription>();

  constructor(public modalRef: MdbModalRef<MissingPermissionsModalComponent>) {
  }

  public close() {
    this.modalRef.close();

  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  onHidden() {
    this.subscrmanager.destroy();
  }

  reload() {
    document.location.reload(true);
  }
}
