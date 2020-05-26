import {Component, OnInit, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {NavbarService} from '../../gui/navbar/navbar.service';
import {TextConverter} from '../../obj/Converters';
import {StatisticElem} from '../../obj/statistics/StatisticElement';
import {SubscriptionManager} from 'octra-components';
import {AppStorageService, TranscriptionService, UserInteractionsService} from '../../shared/service';

@Component({
  selector: 'octra-statistics-modal',
  templateUrl: './statistics-modal.component.html',
  styleUrls: ['./statistics-modal.component.css']
})

export class StatisticsModalComponent implements OnInit {
  modalRef: BsModalRef;
  public visible = false;
  public bgdescr = '';
  public sendProObj = true;
  public bugsent = false;
  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal', {static: true}) modal: any;
  public transcrObjStr = '';
  protected data = null;
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager();

  public get transcrServ(): TranscriptionService {
    return this.navbarService.transcrService;
  }

  public get uiService(): UserInteractionsService {
    return this.navbarService.uiService;
  }

  public get isvalid(): boolean {
    if (this.sendProObj || this.bgdescr !== '') {
      return true;
    } else {
      return false;
    }
  }

  get UIElements(): StatisticElem[] {
    return (!(this.uiService === null || this.uiService === undefined)) ? this.uiService.elements : null;
  }

  constructor(private modalService: BsModalService, private navbarService: NavbarService, private appStorage: AppStorageService) {
  }

  ngOnInit() {
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal, this.config);
      this.visible = true;
      this.transcrObjStr = this.stringify(this.transcrServ.exportDataToJSON());
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

  clearElements() {
    this.uiService.clear();
    this.appStorage.clearLoggingData().catch((err) => {
      console.error(err);
    });
  }

  getText() {
    if (!(this.transcrServ === null || this.transcrServ === undefined)) {
      return this.navbarService.transcrService.getTranscriptString(new TextConverter());
    }

    return '';
  }

  public stringify(value: string) {
    return JSON.stringify(value, null, 2);
  }
}
