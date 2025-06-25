import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.scss'],
  imports: [TranslocoPipe],
})
export class ErrorModalComponent extends OctraModal {
  protected override activeModal: NgbActiveModal;

  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: true,
  };

  @ViewChild('modal', { static: true }) modal!: TemplateRef<any>;
  text = '';
  showOKButton = true;

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('errorModal', activeModal);

    this.activeModal = activeModal;
  }
}
