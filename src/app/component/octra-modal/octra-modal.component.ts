import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SubscriptionManager} from '../../shared/SubscriptionManager';
import {ModalComponent} from 'ng2-bs3-modal/components/modal';
import {ModalService} from '../../service/modal.service';
import {isNullOrUndefined} from 'util';
import {BugReportService, ConsoleEntry} from '../../service/bug-report.service';
import {APIService} from '../../service/api.service';
import {SessionService} from '../../service/session.service';
import {AppInfo} from '../../app.info';

@Component({
  selector: 'app-octra-modal',
  templateUrl: './octra-modal.component.html',
  styleUrls: ['./octra-modal.component.css']
})
export class OctraModalComponent implements OnInit, OnDestroy {

  private _subscrmanager: SubscriptionManager;
  @ViewChild('login_invalid') login_invalid: ModalComponent;
  @ViewChild('transcription_delete') transcription_delete: ModalComponent;
  @ViewChild('transcription_stop') transcription_stop: ModalComponent;
  @ViewChild('error') error: ModalComponent;
  @ViewChild('bugreport') bugreport: ModalComponent;
  @ViewChild('supportedfiles') supportedfiles: ModalComponent;

  public bgdescr = '';
  public bgemail = '';
  public sendpro_obj = true;

  public bugsent = false;

  public get AppInfo(): AppInfo {
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
              private sessService: SessionService) {
  }

  ngOnInit() {
    this.bgemail = (!isNullOrUndefined(this.sessService.email)) ? this.sessService.email : '';
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
    console.log('send bug report');
    this.sessService.email = this.bgemail;
    const bugs: ConsoleEntry[] = (this.sendpro_obj) ? this.bugService.console : [];

    console.log(JSON.stringify(this.bugService.getPackage()));

    this._subscrmanager.add(
      this.api.sendBugReport(this.bgemail, this.bgdescr, bugs).subscribe(
        (result) => {
          this.bugsent = true;
          console.log(result);
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
