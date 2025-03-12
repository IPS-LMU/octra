import { Component, Input } from '@angular/core';
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
    protected override activeModal: NgbActiveModal,
  ) {
    super('ShortcutsModalComponent', activeModal);
  }

  getShortcut(entry: any, platform: string) {
    return entry.keys[platform];
  }
}
