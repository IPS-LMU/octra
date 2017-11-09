import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {ModalService} from '../../shared/service/modal.service';
import {isNullOrUndefined} from 'util';
import {BugReportService} from '../../shared/service/bug-report.service';
import {APIService} from '../../shared/service/api.service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {AppInfo} from '../../../app.info';
import {SettingsService} from '../../shared/service/settings.service';
import {BsModalComponent} from 'ng2-bs3-modal';

@Component({
  selector: 'app-octra-modal',
  templateUrl: './octra-modal.component.html',
  styleUrls: ['./octra-modal.component.css']
})
export class OctraModalComponent implements OnInit, OnDestroy {

  private _subscrmanager: SubscriptionManager;
  @ViewChild('login_invalid') login_invalid: BsModalComponent;
  @ViewChild('transcription_delete') transcription_delete: BsModalComponent;
  @ViewChild('transcription_stop') transcription_stop: BsModalComponent;
  @ViewChild('error') error: BsModalComponent;
  @ViewChild('bugreport') bugreport: BsModalComponent;
  @ViewChild('supportedfiles') supportedfiles: BsModalComponent;
  @ViewChild('yesno') yesno: BsModalComponent;

  public bgdescr = '';
  public bgemail = '';
  public sendpro_obj = true;

  public bugsent = false;

  public get AppInfo(): any {
    return AppInfo;
  }

  public data: any;

  public get isvalid(): boolean {
    if (this.sendpro_obj || this.bgdescr !== '') {
      return true;
    } else {
      return false;
    }
  }

  constructor(private modService: ModalService,
              public bugService: BugReportService,
              private api: APIService,
              private appStorage: AppStorageService,
              private settService: SettingsService) {
  }

  ngOnInit() {
    this.bgemail = (!isNullOrUndefined(this.appStorage.email)) ? this.appStorage.email : '';
    this._subscrmanager = new SubscriptionManager();


    this._subscrmanager.add(this.modService.showmodal.subscribe(
      (result: any) => {
        this.data = result;

        if (!isNullOrUndefined(result.type)) {
          this[result.type].open();
        } else {
          throw new Error('modal function not supported');
        }
      }));
  }

  ngOnDestroy() {
    this._subscrmanager.destroy();
  }

  sendBugReport() {
    this.appStorage.email = this.bgemail;

    this._subscrmanager.add(
      this.bugService.sendReport(this.bgemail, this.bgdescr, this.sendpro_obj, {
        auth_token: this.settService.app_settings.octra.bugreport.auth_token,
        url: this.settService.app_settings.octra.bugreport.url
      }).subscribe(
        (result) => {
          this.bugsent = true;
          setTimeout(() => {
            this.bgdescr = '';
            this.bugreport.close();
            this.bugsent = false;
          }, 2000);
        }
      )
    );
  }
}
