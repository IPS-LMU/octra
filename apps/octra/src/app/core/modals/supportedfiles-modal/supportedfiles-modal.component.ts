import {Component} from '@angular/core';
import {AppInfo} from '../../../app.info';
import {OctraModal} from '../types';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';

@Component({
  selector: 'octra-supportedfiles-modal',
  templateUrl: './supportedfiles-modal.component.html',
  styleUrls: ['./supportedfiles-modal.component.scss']
})

export class SupportedFilesModalComponent extends OctraModal {
  AppInfo = AppInfo;

  constructor(modalRef: MDBModalRef, modalService: MDBModalService) {
    super('supportedFilesModal', modalRef, modalService);
  }
}
