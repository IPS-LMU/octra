import {Component, Input} from '@angular/core';
import {BrowserInfo} from '../../shared';
import {KeymappingService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {MdbModalConfig, MdbModalRef} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-shortcuts-modal',
  templateUrl: './shortcuts-modal.component.html',
  styleUrls: ['./shortcuts-modal.component.scss']
})
export class ShortcutsModalComponent {
  public static config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    modalClass: 'modal-lg'
  };

  @Input() editor = '';

  protected data = undefined;

  public get platform(): string {
    return BrowserInfo.platform;
  }

  constructor(public appStorage: AppStorageService,
              public keyMap: KeymappingService,
              public modalRef: MdbModalRef<ShortcutsModalComponent>) {
  }

  public close() {
    this.modalRef.close();
  }
}
