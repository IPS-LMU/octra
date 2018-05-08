import {Component, EventEmitter, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {ModalService} from '../modal.service';
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

        console.log('here!');
        if (!isNullOrUndefined(result.type) && this[result.type] !== undefined) {
          console.log(result.data);
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
