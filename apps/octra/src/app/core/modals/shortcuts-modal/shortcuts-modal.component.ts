import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {BrowserInfo} from '../../shared';
import {KeymappingService, SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {BugReportService} from '../../shared/service/bug-report.service';

@Component({
  selector: 'octra-shortcuts-modal',
  templateUrl: './shortcuts-modal.component.html',
  styleUrls: ['./shortcuts-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShortcutsModalComponent implements OnInit {
  modalRef: BsModalRef;
  public visible = false;
  @Input() editor = '';

  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal', {static: true}) modal: any;
  protected data = null;
  private actionperformed: Subject<void> = new Subject<void>();

  public get platform(): string {
    return BrowserInfo.platform;
  }

  constructor(private modalService: BsModalService, private appStorage: AppStorageService,
              private bugService: BugReportService, private settService: SettingsService,
              public keyMap: KeymappingService, private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
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
