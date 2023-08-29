import { Component } from '@angular/core';
import { NavbarService } from '../../component/navbar/navbar.service';
import { StatisticElem } from '../../obj/statistics/StatisticElement';
import { UserInteractionsService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { OctraModal } from '../types';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';

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
  public transcrObjStr = '';
  protected data = undefined;

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
    public annotationStore: AnnotationStoreService,
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

  public stringify(value: string) {
    return JSON.stringify(value, undefined, 2);
  }
}
