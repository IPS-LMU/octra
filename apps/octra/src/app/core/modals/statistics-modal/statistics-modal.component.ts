import { Component } from '@angular/core';
import { NavbarService } from '../../component/navbar/navbar.service';
import { StatisticElem } from '../../obj/statistics/StatisticElement';
import {
  TranscriptionService,
  UserInteractionsService,
} from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { TextConverter } from '@octra/annotation';
import { OctraModal } from '../types';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'octra-statistics-modal',
  templateUrl: './statistics-modal.component.html',
  styleUrls: ['./statistics-modal.component.scss'],
})
export class StatisticsModalComponent extends OctraModal {
  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: true,
    scrollable: true,
    size: 'lg',
  };

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

  get UIElements(): StatisticElem[] | undefined {
    return this.uiService !== undefined ? this.uiService.elements : undefined;
  }

  constructor(
    modalService: NgbModal,
    private navbarService: NavbarService,
    private appStorage: AppStorageService,
    protected override activeModal: NgbActiveModal
  ) {
    super('statisticsModal', activeModal);
  }

  clearElements() {
    this.uiService.clear();
    this.appStorage.clearLoggingDataPermanently();
  }

  getText() {
    if (this.transcrServ !== undefined) {
      return this.navbarService.transcrService.getTranscriptString(
        new TextConverter()
      );
    }

    return '';
  }

  public stringify(value: string) {
    return JSON.stringify(value, undefined, 2);
  }
}
