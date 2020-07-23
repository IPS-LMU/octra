import {Component, EventEmitter, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {AppInfo} from '../../../app.info';
import {SubscriptionManager} from '@octra/components';
import {APIService, SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {BugReportService} from '../../shared/service/bug-report.service';
import {ModalService} from '../modal.service';

@Component({
  selector: 'octra-modal',
  templateUrl: './octra-modal.component.html',
  styleUrls: ['./octra-modal.component.css']
})
export class OctraModalComponent implements OnInit, OnDestroy {

  @ViewChild('loginInvalid', {static: true}) loginInvalid: BsModalRef;
  @ViewChild('transcriptionDelete', {static: true}) transcriptionDelete: BsModalRef;
  @ViewChild('transcriptionStop', {static: true}) transcriptionStop: BsModalRef;
  @ViewChild('error', {static: true}) error: BsModalRef;
  @ViewChild('bugreport', {static: true}) bugreport: BsModalRef;
  @ViewChild('supportedfiles', {static: true}) supportedfiles: BsModalRef;
  @ViewChild('yesno', {static: true}) yesno: BsModalRef;
  public bgdescr = '';
  public bgemail = '';
  public sendproObj = true;
  public bugsent = false;
  public data: any;
  private _subscrmanager: SubscriptionManager;

  public get AppInfo(): any {
    return AppInfo;
  }

  constructor(private modService: ModalService,
              public bugService: BugReportService,
              private api: APIService,
              private appStorage: AppStorageService,
              private settService: SettingsService) {
  }

  ngOnInit() {
    this.bgemail = (!(this.appStorage.email === null || this.appStorage.email === undefined)) ? this.appStorage.email : '';
    this._subscrmanager = new SubscriptionManager();

    this._subscrmanager.add(this.modService.showmodal.subscribe(
      (result: any) => {
        this.data = result;

        if (!(result.type === null || result.type === undefined) && this[result.type] !== undefined) {
          this[result.type].open(result.data).then(
            (answer: any | undefined) => {
              result.emitter.emit(answer);
            }
          ).catch(
            (err) => {
              console.error(err);
            }
          );
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
