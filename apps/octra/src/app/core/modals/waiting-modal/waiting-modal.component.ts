import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-waiting-modal',
  templateUrl: './waiting-modal.component.html',
  styleUrls: ['./waiting-modal.component.scss'],
  imports: [TranslocoPipe],
})
export class WaitingModalComponent extends OctraModal {
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
