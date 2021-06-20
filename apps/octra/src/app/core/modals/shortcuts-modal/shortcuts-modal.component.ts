import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild} from '@angular/core';
import {Subject} from 'rxjs';
import {BrowserInfo} from '../../shared';
import {KeymappingService, SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {BugReportService} from '../../shared/service/bug-report.service';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-shortcuts-modal',
  templateUrl: './shortcuts-modal.component.html',
  styleUrls: ['./shortcuts-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShortcutsModalComponent {
  modalRef: MdbModalRef<ShortcutsModalComponent>;
  public visible = false;
  @Input() editor = '';

  config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    modalClass: 'modal-lg'
  };
  @ViewChild('modal', {static: true}) modal: any;
  protected data = undefined;
  private actionperformed: Subject<void> = new Subject<void>();

  public get platform(): string {
    return BrowserInfo.platform;
  }

  constructor(private modalService: MdbModalService, public appStorage: AppStorageService,
              private bugService: BugReportService, private settService: SettingsService,
              public keyMap: KeymappingService, private cd: ChangeDetectorRef) {
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal, this.config);
      this.visible = true;
      this.cd.markForCheck();
      this.cd.detectChanges();
      const subscr = this.actionperformed.subscribe(
        (action) => {
          resolve(action);
          subscr.unsubscribe();
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  public close() {
    this.modal.hide();
    this.visible = false;
    this.actionperformed.next();
  }
}
