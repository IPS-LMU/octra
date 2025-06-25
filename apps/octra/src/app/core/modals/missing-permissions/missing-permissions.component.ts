import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-missing-permissions-modal',
  templateUrl: './missing-permissions.component.html',
  styleUrls: ['./missing-permissions.component.scss'],
  imports: [TranslocoPipe],
})
export class MissingPermissionsModalComponent extends OctraModal {
  protected override activeModal: NgbActiveModal;

  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: 'static',
  };

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('MissingPermissionsModalComponent', activeModal);

    this.activeModal = activeModal;
  }

  reload() {
    document.location.reload();
  }
}
