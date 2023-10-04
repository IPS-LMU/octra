import { Component, Input } from '@angular/core';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { OctraModal } from '../types';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { BrowserInfo } from '@octra/web-media';
import { ShortcutService } from '../../shared/service/shortcut.service';

@Component({
  selector: 'octra-shortcuts-modal',
  templateUrl: './shortcuts-modal.component.html',
  styleUrls: ['./shortcuts-modal.component.scss'],
})
export class ShortcutsModalComponent extends OctraModal {
  public static options: NgbModalOptions = {
    keyboard: true,
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
    public shortcutService: ShortcutService,
    protected override activeModal: NgbActiveModal
  ) {
    super('ShortcutsModalComponent', activeModal);
  }

  getShortcut(entry: any, platform: string) {
    return entry.keys[platform];
  }
}
