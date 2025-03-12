import { Component } from '@angular/core';
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
  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: 'static',
  };

  constructor(protected override activeModal: NgbActiveModal) {
    super('MissingPermissionsModalComponent', activeModal);
  }

  reload() {
    document.location.reload();
  }
}
