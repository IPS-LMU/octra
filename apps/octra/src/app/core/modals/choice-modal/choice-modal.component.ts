import { Component, inject } from '@angular/core';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

export interface ChoiceModalButtons {
  label: string;
  value: string;
  btnClass: string;
  colClass: string;
}

@Component({
  selector: 'octra-choice-modal',
  templateUrl: './choice-modal.component.html',
  styleUrls: ['./choice-modal.component.css'],
  standalone: true,
  imports: [],
})
export class ChoiceModalComponent {
  bsModalRef = inject(NgbActiveModal);

  public static options: NgbModalOptions = {
    backdrop: true,
    size: 'lg',
  };

  title = '';
  message = '';
  choices: ChoiceModalButtons[] = [];
}
