import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-yes-no-modal',
  templateUrl: './yes-no-modal.component.html',
  styleUrls: ['./yes-no-modal.component.scss'],
  imports: [TranslocoPipe],
})
export class YesNoModalComponent extends OctraModal {
  protected override activeModal: NgbActiveModal;

  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: 'static',
    size: 'md',
  };
  public message = '';

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('yesNoModal', activeModal);

    this.activeModal = activeModal;
  }
}
