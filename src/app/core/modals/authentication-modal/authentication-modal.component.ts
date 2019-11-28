import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, SecurityContext, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs';
import {AppStorageService, KeymappingService, SettingsService} from '../../shared/service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {BugReportService} from '../../shared/service/bug-report.service';
import {BrowserInfo} from '../../shared';
import {AsrService} from '../../shared/service/asr.service';
import {DomSanitizer, SafeResourceUrl, SafeUrl} from '@angular/platform-browser';

@Component({
  selector: 'app-authentication-modal',
  templateUrl: './authentication-modal.component.html',
  styleUrls: ['./authentication-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthenticationModalComponent implements OnInit {
  modalRef: BsModalRef;
  public visible = false;
  public url: SafeResourceUrl = '';

  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal', {static: true}) modal: any;
  protected data = null;
  private actionperformed: Subject<void> = new Subject<void>();

  private subscrmanager = new SubscriptionManager();

  public get platform(): string {
    return BrowserInfo.platform;
  }

  constructor(private modalService: BsModalService, private appStorage: AppStorageService,
              private bugService: BugReportService, private settService: SettingsService,
              public keyMap: KeymappingService, private cd: ChangeDetectorRef,
              private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl(AsrService.authURL);
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
