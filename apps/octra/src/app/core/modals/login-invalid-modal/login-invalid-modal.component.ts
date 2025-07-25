import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-login-invalid-modal',
  templateUrl: './login-invalid-modal.component.html',
  styleUrls: ['./login-invalid-modal.component.scss'],
  imports: [TranslocoPipe],
})
export class LoginInvalidModalComponent extends OctraModal {
  protected override activeModal: NgbActiveModal;

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('yesNoModal', activeModal);

    this.activeModal = activeModal;
  }
}
