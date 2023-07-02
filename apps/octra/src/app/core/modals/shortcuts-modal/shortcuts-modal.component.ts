import { Component, Input } from '@angular/core';
import { KeymappingService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { OctraModal } from '../types';
import { BrowserInfo } from '@octra/utilities';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'octra-shortcuts-modal',
  templateUrl: './shortcuts-modal.component.html',
  styleUrls: ['./shortcuts-modal.component.scss'],
})
export class ShortcutsModalComponent extends OctraModal {
  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: true,
    scrollable: true,
    size: 'lg',
  };

  @Input() editor = '';

  protected data = undefined;

  public get platform(): string {
    return BrowserInfo.platform;
  }

  constructor(
    public appStorage: AppStorageService,
    public keyMap: KeymappingService,
    protected override activeModal: NgbActiveModal
  ) {
    super('ShortcutsModalComponent', activeModal);
  }
}
