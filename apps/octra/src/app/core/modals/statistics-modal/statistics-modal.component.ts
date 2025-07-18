import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { NavbarService } from '../../component/navbar/navbar.service';
import { StatisticElem } from '../../obj/statistics/StatisticElement';
import { UserInteractionsService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-statistics-modal',
  templateUrl: './statistics-modal.component.html',
  styleUrls: ['./statistics-modal.component.scss'],
  imports: [AsyncPipe, DatePipe, TranslocoPipe],
})
export class StatisticsModalComponent extends OctraModal {
  annotationStore = inject(AnnotationStoreService);
  private navbarService = inject(NavbarService);
  private appStorage = inject(AppStorageService);
  protected override activeModal: NgbActiveModal;

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

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('statisticsModal', activeModal);

    this.activeModal = activeModal;
  }

  clearElements() {
    this.uiService.clear();
    this.appStorage.clearLoggingDataPermanently();
  }

  public stringify(value: string) {
    return JSON.stringify(value, undefined, 2);
  }
}
