import {Component} from '@angular/core';
import {OctraModal} from '../types';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';

@Component({
  selector: 'octra-yes-no-modal',
  templateUrl: './yes-no-modal.component.html',
  styleUrls: ['./yes-no-modal.component.scss']
})
export class YesNoModalComponent extends OctraModal {
  public message: string;

  constructor(public modalRef: MDBModalRef, public modalService: MDBModalService) {
    super('yesNoModal');
    this.init(modalService, modalRef);
  }

}
