import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {SubscriptionManager} from '@octra/utilities';
import {OctraModal} from '../types';
import { NgbActiveModal, NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'octra-missing-permissions-modal',
  templateUrl: './missing-permissions.component.html',
  styleUrls: ['./missing-permissions.component.scss']
})
export class MissingPermissionsModalComponent extends OctraModal implements OnDestroy {
  private subscrmanager = new SubscriptionManager<Subscription>();

  constructor(protected override activeModal: NgbActiveModal) {
    super('MissingPermissionsModalComponent', activeModal);
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  onHidden() {
    this.subscrmanager.destroy();
  }

  reload() {
    document.location.reload();
  }
}
