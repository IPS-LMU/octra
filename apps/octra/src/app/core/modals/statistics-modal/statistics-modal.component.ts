import {Component} from '@angular/core';
import {NavbarService} from '../../component/navbar/navbar.service';
import {StatisticElem} from '../../obj/statistics/StatisticElement';
import {TranscriptionService, UserInteractionsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {TextConverter} from '@octra/annotation';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {OctraModal} from '../types';

@Component({
  selector: 'octra-statistics-modal',
  templateUrl: './statistics-modal.component.html',
  styleUrls: ['./statistics-modal.component.scss']
})

export class StatisticsModalComponent extends OctraModal {
  public bgdescr = '';
  public sendProObj = true;
  public bugsent = false;
  public transcrObjStr = '';
  protected data = undefined;

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

  constructor(modalService: MDBModalService, private navbarService: NavbarService, private appStorage: AppStorageService,
              modalRef: MDBModalRef) {
    super('statisticsModal');
    this.init(modalService, modalRef);
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
