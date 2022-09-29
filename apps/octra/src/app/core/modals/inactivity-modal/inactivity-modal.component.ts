import {Component} from '@angular/core';
import {SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {OctraModal} from '../types';

@Component({
  selector: 'octra-activity-timeout-modal',
  templateUrl: './inactivity-modal.component.html',
  styleUrls: ['./inactivity-modal.component.scss']
})

export class InactivityModalComponent extends OctraModal {
  constructor(public appStorage: AppStorageService, public settService: SettingsService,
              modalRef: MDBModalRef, modalService: MDBModalService) {
    super('inactivityModal');
    this.init(modalService, modalRef);
  }
}
