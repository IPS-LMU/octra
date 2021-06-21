import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {SubscriptionManager} from '@octra/utilities';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {OctraModal} from '../types';

@Component({
  selector: 'octra-missing-permissions-modal',
  templateUrl: './missing-permissions.component.html',
  styleUrls: ['./missing-permissions.component.scss']
})
export class MissingPermissionsModalComponent extends OctraModal implements OnDestroy {
  private subscrmanager = new SubscriptionManager<Subscription>();

  constructor(modalRef: MDBModalRef, modalService: MDBModalService) {
    super('MissingPermissionsModalComponent', modalRef, modalService);
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
