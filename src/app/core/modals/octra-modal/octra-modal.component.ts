import {Component, EventEmitter, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {ModalService} from '../modal.service';
import {isNullOrUndefined} from 'util';
import {BugReportService} from '../../shared/service/bug-report.service';
import {APIService} from '../../shared/service/api.service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {AppInfo} from '../../../app.info';
import {SettingsService} from '../../shared/service/settings.service';
import {BsModalRef} from 'ngx-bootstrap';

@Component({
  selector: 'app-octra-modal',
  templateUrl: './octra-modal.component.html',
  styleUrls: ['./octra-modal.component.css']
})
export class OctraModalComponent implements OnInit, OnDestroy {

  private _subscrmanager: SubscriptionManager;
  @ViewChild('login_invalid') login_invalid: BsModalRef;
  @ViewChild('transcription_delete') transcription_delete: BsModalRef;
  @ViewChild('transcription_stop') transcription_stop: BsModalRef;
  @ViewChild('error') error: BsModalRef;
  @ViewChild('bugreport') bugreport: BsModalRef;
  @ViewChild('supportedfiles') supportedfiles: BsModalRef;
  @ViewChild('yesno') yesno: BsModalRef;

  public bgdescr = '';
  public bgemail = '';
  public sendpro_obj = true;

  public bugsent = false;

  public get AppInfo(): any {
    return AppInfo;
  }

  public data: any;

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

        if (!isNullOrUndefined(result.type) && this[result.type] !== undefined) {
          this[result.type].open(result.data).then(
            (answer) => {
              result.emitter.emit(answer);
            }
          ).catch(
            (err) => {
              console.error(err);
            }
          );
          /*
          jQuery(function () {
            jQuery('[data-toggle="tooltip"]').tooltip();
          });*/
        } else {
          const emitter: EventEmitter<any> = result.emitter;
          emitter.error('modal function not supported');
        }
      }));
  }

  ngOnDestroy() {
    this._subscrmanager.destroy();
  }
}
