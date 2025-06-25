import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  NgbActiveModal,
  NgbModalOptions,
  NgbPopover,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { Converter } from '@octra/annotation';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { AudioFormat } from '@octra/web-media';
import { AppInfo } from '../../../app.info';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-supportedfiles-modal',
  templateUrl: './supportedfiles-modal.component.html',
  styleUrls: ['./supportedfiles-modal.component.scss'],
  imports: [NgbPopover, NgbTooltip, TranslocoPipe, OctraUtilitiesModule],
})
export class SupportedFilesModalComponent extends OctraModal {
  protected override activeModal: NgbActiveModal;

  public static options: NgbModalOptions = {
    backdrop: true,
    size: 'lg',
  };

  AppInfo = AppInfo;

  supportedFormats: AudioFormat[] = AppInfo.audioformats;
  converters: Converter[] = [];

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('supportedFilesModal', activeModal);
    this.activeModal = activeModal;

    this.converters = AppInfo.converters.map((a) => {
      (a as any)._applications = (a as any)._applications.filter(
        (a) => a.application.name !== 'Octra',
      );
      return a;
    });
  }
}
