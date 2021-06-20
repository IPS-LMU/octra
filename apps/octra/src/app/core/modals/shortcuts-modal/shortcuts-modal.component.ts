import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input} from '@angular/core';
import {Subject} from 'rxjs';
import {BrowserInfo} from '../../shared';
import {KeymappingService, SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {BugReportService} from '../../shared/service/bug-report.service';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-shortcuts-modal',
  templateUrl: './shortcuts-modal.component.html',
  styleUrls: ['./shortcuts-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShortcutsModalComponent {
  public static config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    modalClass: 'modal-lg'
  };

  public visible = false;
  @Input() editor = '';

  protected data = undefined;
  private actionperformed: Subject<void> = new Subject<void>();

  public get platform(): string {
    return BrowserInfo.platform;
  }

  constructor(private modalService: MdbModalService, public appStorage: AppStorageService,
              private bugService: BugReportService, private settService: SettingsService,
              public keyMap: KeymappingService, private cd: ChangeDetectorRef,
              public modalRef: MdbModalRef<ShortcutsModalComponent>) {
  }

  public close() {
    this.modalRef.close();
    this.visible = false;
    this.actionperformed.next();
  }
}
