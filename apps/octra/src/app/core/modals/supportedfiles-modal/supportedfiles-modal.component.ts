import { Component } from '@angular/core';
import { AppInfo } from '../../../app.info';
import { OctraModal } from '../types';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { AudioFormat } from '@octra/web-media';

@Component({
  selector: 'octra-supportedfiles-modal',
  templateUrl: './supportedfiles-modal.component.html',
  styleUrls: ['./supportedfiles-modal.component.scss'],
})
export class SupportedFilesModalComponent extends OctraModal {
  public static options: NgbModalOptions = {
    backdrop: true,
    size: 'lg',
  };

  AppInfo = AppInfo;

  supportedFormats: AudioFormat[] = AppInfo.audioformats;

  constructor(protected override activeModal: NgbActiveModal) {
    super('supportedFilesModal', activeModal);
  }
}
