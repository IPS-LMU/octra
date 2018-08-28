import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs/Subject';
import {AppStorageService, KeymappingService, SettingsService} from '../../shared/service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {BugReportService} from '../../shared/service/bug-report.service';
import {BrowserInfo} from '../../shared';

@Component({
  selector: 'app-shortcuts-modal',
  templateUrl: './shortcuts-modal.component.html',
  styleUrls: ['./shortcuts-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ShortcutsModalComponent implements OnInit {
  modalRef: BsModalRef;
  public visible = false;
  @Input() editor: string = '';
  public shortcuts = [];
  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal') modal: any;
  protected data = null;
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager();

  public get platform(): string {
    return BrowserInfo.platform;
  }

  constructor(private modalService: BsModalService, private appStorage: AppStorageService, private bugService: BugReportService, private settService: SettingsService,
              private keyMap: KeymappingService, private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
  }

  public open(data: {
    text: string
  }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal, this.config);
      this.visible = true;
      this.cd.markForCheck();
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
