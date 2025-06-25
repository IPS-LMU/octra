import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-help-modal',
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss'],
  imports: [TranslocoPipe],
})
export class HelpModalComponent extends OctraModal {
  protected override activeModal: NgbActiveModal;

  public static options: NgbModalOptions = {
    size: 'xl',
    backdrop: true,
  };
  public visible = false;

  @ViewChild('modal', { static: true }) modal!: any;
  @ViewChild('content', { static: false }) contentElement!: ElementRef;

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('HelpModalComponent', activeModal);

    this.activeModal = activeModal;
  }
}
