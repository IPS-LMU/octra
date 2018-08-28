import {Component, OnInit, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs/Subject';
import {AppStorageService, TranscriptionService, UserInteractionsService} from '../../shared/service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {TextConverter} from '../../obj/Converters/TextConverter';
import {StatisticElem} from '../../obj/statistics/StatisticElement';
import {NavbarService} from '../../gui/navbar/navbar.service';

@Component({
  selector: 'app-statistics-modal',
  templateUrl: './statistics-modal.component.html',
  styleUrls: ['./statistics-modal.component.css']
})

export class StatisticsModalComponent implements OnInit {
  modalRef: BsModalRef;
  public visible = false;
  public bgemail = '';
  public bgdescr = '';
  public sendpro_obj = true;
  public bugsent = false;
  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal') modal: any;
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
    if (this.sendpro_obj || this.bgdescr !== '') {
      return true;
    } else {
      return false;
    }
  }

  get UIElements(): StatisticElem[] {
    return (!(this.uiService === null || this.uiService === undefined)) ? this.uiService.elements : null;
  }

  get transcrObjStr(): string {
    return JSON.stringify(this.transcrServ.exportDataToJSON(), null, 3);
  }

  constructor(private modalService: BsModalService, private navbarService: NavbarService, private appStorage: AppStorageService) {
  }

  ngOnInit() {
  }

  public open(data: {
    text: string
  }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal, this.config);
      this.visible = true;
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
}
