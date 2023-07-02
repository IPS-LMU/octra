import { Component } from '@angular/core';
import { OctraModal } from '../types';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'octra-missing-permissions-modal',
  templateUrl: './missing-permissions.component.html',
  styleUrls: ['./missing-permissions.component.scss'],
})
export class MissingPermissionsModalComponent extends OctraModal {
  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: false,
  };

  constructor(protected override activeModal: NgbActiveModal) {
    super('MissingPermissionsModalComponent', activeModal);
  }

  reload() {
    document.location.reload();
  }
}
