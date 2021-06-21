import {Component, Input} from '@angular/core';
import {BrowserInfo} from '../../shared';
import {KeymappingService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {OctraModal} from '../types';

@Component({
  selector: 'octra-shortcuts-modal',
  templateUrl: './shortcuts-modal.component.html',
  styleUrls: ['./shortcuts-modal.component.scss']
})
export class ShortcutsModalComponent extends OctraModal {
  @Input() editor = '';

  protected data = undefined;

  public get platform(): string {
    return BrowserInfo.platform;
  }

  constructor(public appStorage: AppStorageService,
              public keyMap: KeymappingService,
              modalRef: MDBModalRef, modalService: MDBModalService) {
    super('ShortcutsModalComponent', modalRef, modalService);
  }
}
