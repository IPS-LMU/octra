import {Component} from '@angular/core';
import {Subject} from 'rxjs';
import {NavbarService} from '../../component/navbar/navbar.service';
import {StatisticElem} from '../../obj/statistics/StatisticElement';
import {TranscriptionService, UserInteractionsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {TextConverter} from '@octra/annotation';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-statistics-modal',
  templateUrl: './statistics-modal.component.html',
  styleUrls: ['./statistics-modal.component.scss']
})

export class StatisticsModalComponent {
  public static config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    modalClass: 'modal-lg'
  };

  public bgdescr = '';
  public sendProObj = true;
  public bugsent = false;
  public transcrObjStr = '';
  protected data = undefined;
  private actionperformed: Subject<void> = new Subject<void>();

  public get transcrServ(): TranscriptionService {
    return this.navbarService.transcrService;
  }

  public get uiService(): UserInteractionsService {
    return this.navbarService.uiService;
  }

  public get isvalid(): boolean {
    return this.sendProObj || this.bgdescr !== '';
  }

  get UIElements(): StatisticElem[] {
    return this.uiService !== undefined ? this.uiService.elements : undefined;
  }

  constructor(private modalService: MdbModalService, private navbarService: NavbarService, private appStorage: AppStorageService,
              public modalRef: MdbModalRef<StatisticsModalComponent>) {
  }

  public close() {
    this.modalRef.close();
    this.actionperformed.next();
  }

  clearElements() {
    this.uiService.clear();
    this.appStorage.clearLoggingDataPermanently();
  }

  getText() {
    if (this.transcrServ !== undefined) {
      return this.navbarService.transcrService.getTranscriptString(new TextConverter());
    }

    return '';
  }

  public stringify(value: string) {
    return JSON.stringify(value, undefined, 2);
  }
}
