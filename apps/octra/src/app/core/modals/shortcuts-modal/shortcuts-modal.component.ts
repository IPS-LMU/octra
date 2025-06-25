import { Component, inject, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { BrowserInfo } from '@octra/web-media';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { ShortcutService } from '../../shared/service/shortcut.service';
import { ShortcutComponent } from '../../shortcut/shortcut.component';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-shortcuts-modal',
  templateUrl: './shortcuts-modal.component.html',
  styleUrls: ['./shortcuts-modal.component.scss'],
  imports: [ShortcutComponent, TranslocoPipe],
})
export class ShortcutsModalComponent extends OctraModal {
  appStorage = inject(AppStorageService);
  shortcutService = inject(ShortcutService);
  protected override activeModal: NgbActiveModal;

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

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('ShortcutsModalComponent', activeModal);

    this.activeModal = activeModal;
  }

  getShortcut(entry: any, platform: string) {
    return entry.keys[platform];
  }
}
