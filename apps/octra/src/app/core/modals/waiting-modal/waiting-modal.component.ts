import { Component } from '@angular/core';
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
