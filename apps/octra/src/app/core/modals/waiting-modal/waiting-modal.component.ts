import { Component } from '@angular/core';
import { OctraModal } from '../types';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'octra-waiting-modal',
  templateUrl: './waiting-modal.component.html',
  styleUrls: ['./waiting-modal.component.scss'],
})
export class WaitingModalComponent extends OctraModal {
  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: 'static',
    size: 'md',
  };
  public message = '';

  constructor(protected override activeModal: NgbActiveModal) {
    super('yesNoModal', activeModal);
  }
}
