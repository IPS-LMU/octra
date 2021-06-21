import {Component} from '@angular/core';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {OctraModal} from '../types';

@Component({
  selector: 'octra-login-invalid-modal',
  templateUrl: './login-invalid-modal.component.html',
  styleUrls: ['./login-invalid-modal.component.scss']
})
export class LoginInvalidModalComponent extends OctraModal {
  constructor(modalRef: MDBModalRef, modalService: MDBModalService) {
    super('yesNoModal', modalRef, modalService);
  }
}
